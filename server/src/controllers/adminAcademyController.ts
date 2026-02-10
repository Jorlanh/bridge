import { Response } from "express";
import { AuthRequest, isAdmin } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { ConsultingSession } from "../models/ConsultingSession.js";
import { z } from "zod";

// Schemas de validação
const lessonSchema = z.object({
  title: z.string().min(1, "Título da aula é obrigatório"),
  description: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  duration: z.number().min(0),
  order: z.number().min(1),
  content: z.string().optional(),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(["pdf", "link", "video", "other"]).optional(),
  })).optional(),
});

const createCourseSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória").trim(),
  level: z.enum(["iniciante", "medio", "avancado"]),
  thumbnail: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  objectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  lessons: z.array(lessonSchema).min(1, "Pelo menos uma aula é obrigatória"),
});

const updateCourseSchema = createCourseSchema.partial().extend({
  lessons: z.array(lessonSchema).optional(),
});

const createConsultingSessionSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use o formato YYYY-MM-DD"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida. Use o formato HH:mm"),
  duration: z.number().min(15).max(240),
  maxParticipants: z.number().min(1),
  instructor: z.string().min(1, "Instrutor é obrigatório"),
  platform: z.enum(["zoom", "meet", "teams", "other"]).optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
  status: z.enum(["scheduled", "available", "full", "completed", "cancelled"]).optional(),
});

const updateConsultingSessionSchema = createConsultingSessionSchema.partial();

// ========== CURSOS ==========

// Listar todos os cursos (admin)
export const getAllCourses = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const courses = await Course.find().sort({ createdAt: -1 });
    const coursesWithLessons = await Promise.all(
      courses.map(async (course) => {
        const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 });
        return {
          id: course._id.toString(),
          title: course.title,
          description: course.description,
          category: course.category,
          duration: course.duration,
          lessons: course.lessons,
          thumbnail: course.thumbnail,
          videoUrl: course.videoUrl,
          featured: course.featured,
          status: course.status,
          objectives: course.objectives || [],
          prerequisites: course.prerequisites || [],
          lessonsData: lessons.map((lesson) => ({
            id: lesson._id.toString(),
            title: lesson.title,
            description: lesson.description,
            videoUrl: lesson.videoUrl,
            duration: lesson.duration,
            order: lesson.order,
            content: lesson.content,
            resources: lesson.resources || [],
          })),
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        };
      })
    );

    res.json({
      success: true,
      courses: coursesWithLessons,
    });
  } catch (error) {
    console.error("Get all courses error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar cursos",
    });
  }
};

// Criar curso (admin)
export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const data = createCourseSchema.parse(req.body);

    // Calcular duração total e número de aulas
    const totalDuration = data.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
    const lessonsCount = data.lessons.length;

    const course = new Course({
      title: data.title,
      description: data.description,
      category: data.category,
      level: data.level,
      duration: totalDuration,
      lessons: lessonsCount,
      thumbnail: data.thumbnail,
      videoUrl: data.videoUrl,
      featured: data.featured || false,
      status: data.status || "active",
      objectives: data.objectives || [],
      prerequisites: data.prerequisites || [],
    });

    await course.save();

    // Criar aulas
    const lessons = await Promise.all(
      data.lessons.map((lessonData) =>
        Lesson.create({
          courseId: course._id,
          title: lessonData.title,
          description: lessonData.description,
          videoUrl: lessonData.videoUrl,
          duration: lessonData.duration,
          order: lessonData.order,
          content: lessonData.content,
          resources: lessonData.resources || [],
        })
      )
    );

    res.status(201).json({
      success: true,
      message: "Curso criado com sucesso",
      course: {
        id: course._id.toString(),
        title: course.title,
        description: course.description,
        category: course.category,
        duration: course.duration,
        lessons: course.lessons,
        thumbnail: course.thumbnail,
        videoUrl: course.videoUrl,
        featured: course.featured,
        status: course.status,
        objectives: course.objectives,
        prerequisites: course.prerequisites,
      },
      lessonsCount: lessons.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
      });
    }

    console.error("Create course error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar curso",
    });
  }
};

// Atualizar curso (admin)
export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const { id } = req.params;
    const data = updateCourseSchema.parse(req.body);

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Curso não encontrado",
      });
    }

    if (data.title) course.title = data.title;
    if (data.description) course.description = data.description;
    if (data.category) course.category = data.category;
    if (data.level) course.level = data.level;
    if (data.thumbnail !== undefined) course.thumbnail = data.thumbnail;
    if (data.videoUrl !== undefined) course.videoUrl = data.videoUrl;
    if (data.featured !== undefined) course.featured = data.featured;
    if (data.status) course.status = data.status;
    if (data.objectives) course.objectives = data.objectives;
    if (data.prerequisites) course.prerequisites = data.prerequisites;

    // Se lessons foram fornecidas, atualizar aulas
    if (data.lessons && Array.isArray(data.lessons)) {
      // Deletar aulas antigas
      await Lesson.deleteMany({ courseId: course._id });

      // Criar novas aulas
      const lessons = await Promise.all(
        data.lessons.map((lessonData) =>
          Lesson.create({
            courseId: course._id,
            title: lessonData.title,
            description: lessonData.description,
            videoUrl: lessonData.videoUrl,
            duration: lessonData.duration,
            order: lessonData.order,
            content: lessonData.content,
            resources: lessonData.resources || [],
          })
        )
      );

      // Atualizar duração total e número de aulas
      course.duration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
      course.lessons = lessons.length;
    }

    await course.save();

      // Buscar aulas atualizadas
      const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 });

      res.json({
      success: true,
      message: "Curso atualizado com sucesso",
      course: {
        id: course._id.toString(),
        title: course.title,
        description: course.description,
        category: course.category,
        duration: course.duration,
        lessons: course.lessons,
        thumbnail: course.thumbnail,
        videoUrl: course.videoUrl,
        featured: course.featured,
        status: course.status,
        objectives: course.objectives || [],
        prerequisites: course.prerequisites || [],
        lessonsData: lessons.map((lesson) => ({
          id: lesson._id.toString(),
          title: lesson.title,
          description: lesson.description,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          order: lesson.order,
          content: lesson.content,
          resources: lesson.resources || [],
        })),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
      });
    }

    console.error("Update course error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar curso",
    });
  }
};

// Deletar curso (admin)
export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const { id } = req.params;

    // Deletar aulas primeiro
    await Lesson.deleteMany({ courseId: id });

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Curso não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Curso deletado com sucesso",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar curso",
    });
  }
};

// Gerar curso com IA
export const generateCourseWithAI = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const { topic, category, numberOfLessons } = req.body;

    if (!topic || !category) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: topic, category",
      });
    }

    const { generateCourseContent } = await import("../utils/gemini.js");
    const result = await generateCourseContent(topic, category, numberOfLessons || 5);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao gerar conteúdo do curso",
      });
    }

    res.json({
      success: true,
      courseData: result.courseData,
    });
  } catch (error) {
    console.error("Generate course with AI error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar curso com IA",
    });
  }
};

// ========== SESSÕES DE CONSULTORIA ==========

// Gerar sessão de consultoria com IA
export const generateConsultingSessionWithAI = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const { topic, description } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: topic",
      });
    }

    const { generateConsultingSessionWithAI: generateAI } = await import("../utils/gemini.js");
    const result = await generateAI(topic, description);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao gerar consultoria com IA",
      });
    }

    res.json({
      success: true,
      consultingData: result.consultingData,
    });
  } catch (error) {
    console.error("Generate consulting session with AI error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar consultoria com IA",
    });
  }
};

// Listar todas as sessões (admin)
export const getAllConsultingSessions = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const sessions = await ConsultingSession.find()
      .populate("participants", "name email")
      .sort({ date: -1, time: -1 });

    const now = new Date();

    // Atualizar status para "completed" quando sessão já passou e ainda não foi marcada
    for (const session of sessions) {
      if (session.status !== "completed" && session.status !== "cancelled") {
        const sessionDate = new Date(session.date);
        const [hours, minutes] = session.time.split(":").map(Number);
        sessionDate.setHours(hours, minutes, 0, 0);

        const startTime = sessionDate.getTime();
        const endTime = startTime + session.duration * 60 * 1000;

        if (now.getTime() > endTime) {
          session.status = "completed";
          await session.save();
        }
      }
    }

    res.json({
      success: true,
      sessions: sessions.map((session) => ({
        id: session._id.toString(),
        title: session.title,
        description: session.description,
        date: session.date,
        time: session.time,
        duration: session.duration,
        maxParticipants: session.maxParticipants,
        currentParticipants: session.currentParticipants,
        status: session.status,
        instructor: session.instructor,
        platform: session.platform,
        meetingLink: session.meetingLink,
        participants: (session.participants as any[])?.map((p: any) => ({
          id: p._id?.toString(),
          name: p.name,
          email: p.email,
        })) || [],
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get all consulting sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar sessões de consultoria",
    });
  }
};

// Criar sessão de consultoria (admin)
export const createConsultingSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const data = createConsultingSessionSchema.parse(req.body);

    const session = new ConsultingSession({
      title: data.title,
      description: data.description || "",
      date: new Date(data.date),
      time: data.time,
      duration: data.duration,
      maxParticipants: data.maxParticipants,
      currentParticipants: 0,
      instructor: data.instructor,
      platform: data.platform || "zoom",
      meetingLink: data.meetingLink || undefined,
      status: data.status || "available",
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: "Sessão de consultoria criada com sucesso",
      session: {
        id: session._id.toString(),
        title: session.title,
        description: session.description,
        date: session.date,
        time: session.time,
        duration: session.duration,
        maxParticipants: session.maxParticipants,
        status: session.status,
        instructor: session.instructor,
        platform: session.platform,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
      });
    }

    console.error("Create consulting session error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar sessão de consultoria",
    });
  }
};

// Atualizar sessão de consultoria (admin)
export const updateConsultingSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const { id } = req.params;
    const data = updateConsultingSessionSchema.parse(req.body);

    const session = await ConsultingSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Sessão não encontrada",
      });
    }

    if (data.title) session.title = data.title;
    if (data.description !== undefined) session.description = data.description;
    if (data.date) session.date = new Date(data.date);
    if (data.time) session.time = data.time;
    if (data.duration !== undefined) session.duration = data.duration;
    if (data.maxParticipants !== undefined) session.maxParticipants = data.maxParticipants;
    if (data.instructor) session.instructor = data.instructor;
    if (data.platform) session.platform = data.platform;
    if (data.meetingLink !== undefined) session.meetingLink = data.meetingLink || undefined;
    if (data.status) session.status = data.status;

    // Atualizar status se lotou
    if (session.currentParticipants >= session.maxParticipants && session.status === "available") {
      session.status = "full";
    }

    await session.save();

    res.json({
      success: true,
      message: "Sessão de consultoria atualizada com sucesso",
      session: {
        id: session._id.toString(),
        title: session.title,
        description: session.description,
        date: session.date,
        time: session.time,
        duration: session.duration,
        maxParticipants: session.maxParticipants,
        currentParticipants: session.currentParticipants,
        status: session.status,
        instructor: session.instructor,
        platform: session.platform,
        meetingLink: session.meetingLink,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
      });
    }

    console.error("Update consulting session error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar sessão de consultoria",
    });
  }
};

// Deletar sessão de consultoria (admin)
export const deleteConsultingSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    const { id } = req.params;

    const session = await ConsultingSession.findByIdAndDelete(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Sessão não encontrada",
      });
    }

    res.json({
      success: true,
      message: "Sessão de consultoria deletada com sucesso",
    });
  } catch (error) {
    console.error("Delete consulting session error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar sessão de consultoria",
    });
  }
};

