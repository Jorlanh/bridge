import { Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import QRCode from "qrcode";
import { AuthRequest } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { Enrollment } from "../models/Enrollment.js";
import { Certificate } from "../models/Certificate.js";
import { ConsultingSession } from "../models/ConsultingSession.js";
import { User } from "../models/User.js";
import { createNotification } from "../utils/notifications.js";
import { z } from "zod";

// Buscar todos os cursos disponíveis
export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find({ status: "active" }).sort({ featured: -1, createdAt: -1 });
    
    // Buscar progresso do usuário para cada curso
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        const enrollment = await Enrollment.findOne({
          userId: req.userId,
          courseId: course._id,
        });

        return {
          id: course._id.toString(),
          title: course.title,
          description: course.description,
          category: course.category,
          duration: course.duration,
          lessons: course.lessons,
          thumbnail: course.thumbnail,
          featured: course.featured,
          progress: enrollment?.progress || 0,
          enrolled: !!enrollment,
        };
      })
    );

    res.json({
      success: true,
      courses: coursesWithProgress,
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar cursos",
    });
  }
};

// Buscar um curso específico por ID
export const getCourseById = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "ID do curso é obrigatório",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Curso não encontrado",
      });
    }

    // Buscar aulas do curso
    const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 });

    // Buscar progresso do usuário
    const enrollment = await Enrollment.findOne({
      userId: req.userId,
      courseId: course._id,
    });

    // Verificar se tem certificado
    const certificate = await Certificate.findOne({
      userId: req.userId,
      courseId: course._id,
    });

    res.json({
      success: true,
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
        progress: enrollment?.progress || 0,
        enrolled: !!enrollment,
        completedLessons: enrollment?.completedLessons || 0,
        totalLessons: course.lessons,
        studyTime: enrollment?.studyTime || 0,
        completedAt: enrollment?.completedAt || null,
        hasCertificate: !!certificate,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get course by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar curso",
    });
  }
};

// Buscar estatísticas do Academy
export const getAcademyStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalCourses = await Course.countDocuments({ status: "active" });
    
    const enrollments = await Enrollment.find({ userId: req.userId });
    
    // Calcular progresso geral baseado em cursos COMPLETADOS (progress >= 100%)
    // Progresso geral = (cursos completados / total de cursos disponíveis) × 100
    const completedCourses = enrollments.filter(e => (e.progress || 0) >= 100).length;
    const averageProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
    
    // Tempo total de estudo em minutos (somando todos os cursos)
    const totalStudyTimeMinutes = enrollments.reduce((sum, e) => sum + (e.studyTime || 0), 0);
    const studyHours = Math.round(totalStudyTimeMinutes / 60);
    
    const certificates = await Certificate.countDocuments({ userId: req.userId });

    res.json({
      success: true,
      stats: {
        totalCourses,
        averageProgress,
        certificates,
        studyHours,
        studyMinutes: totalStudyTimeMinutes,
      },
    });
  } catch (error) {
    console.error("Get academy stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas",
    });
  }
};

// Inscrever-se em um curso
export const enrollInCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "ID do curso é obrigatório",
      });
    }

    const course = await Course.findById(courseId);
    if (!course || course.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Curso não encontrado",
      });
    }

    // Verificar se já está inscrito
    const existingEnrollment = await Enrollment.findOne({
      userId: req.userId,
      courseId,
    });

    if (existingEnrollment) {
      return res.json({
        success: true,
        message: "Você já está inscrito neste curso",
        enrollment: existingEnrollment,
      });
    }

    // Criar inscrição
    const enrollment = await Enrollment.create({
      userId: req.userId,
      courseId,
      totalLessons: course.lessons,
      progress: 0,
      completedLessons: 0,
      studyTime: 0,
    });

    // Criar notificação de inscrição
    await createNotification({
      userId: req.userId!,
      title: "Inscrição realizada!",
      message: `Você se inscreveu no curso "${course.title}". Comece a aprender agora!`,
      type: "course",
      link: `/academy/course/${courseId}`,
    });

    res.status(201).json({
      success: true,
      message: "Inscrição realizada com sucesso!",
      enrollment,
    });
  } catch (error) {
    console.error("Enroll in course error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao se inscrever no curso",
    });
  }
};

// Atualizar progresso do curso
export const updateProgress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const { courseId, completedLessons, studyTime } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "ID do curso é obrigatório",
      });
    }

    const enrollment = await Enrollment.findOne({
      userId: req.userId,
      courseId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Você não está inscrito neste curso",
      });
    }

    // Atualizar progresso
    const newCompletedLessons = completedLessons ?? enrollment.completedLessons;
    const newStudyTime = studyTime ? enrollment.studyTime + studyTime : enrollment.studyTime;
    const newProgress = Math.round((newCompletedLessons / enrollment.totalLessons) * 100);

    enrollment.completedLessons = newCompletedLessons;
    enrollment.studyTime = newStudyTime;
    enrollment.progress = newProgress;

    // Se completou 100%, marcar como concluído
    if (newProgress >= 100 && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      
      // Verificar se já existe certificado
      const existingCertificate = await Certificate.findOne({
        userId: req.userId,
        courseId,
      });

      if (!existingCertificate) {
        const course = await Course.findById(courseId);
        if (course) {
          // Criar certificado
          const certificate = await Certificate.create({
            userId: req.userId,
            courseId,
            enrollmentId: enrollment._id,
            title: `Certificado de ${course.title}`,
            courseName: course.title,
            studyTime: newStudyTime,
          });

          // Criar notificação de curso completo
          await createNotification({
            userId: req.userId!,
            title: "Curso concluído! 🎉",
            message: `Parabéns! Você completou o curso "${course.title}" e ganhou um certificado!`,
            type: "success",
            link: `/academy/certificates`,
          });

          // Criar notificação de certificado disponível
          await createNotification({
            userId: req.userId!,
            title: "Certificado disponível",
            message: `Seu certificado do curso "${course.title}" está pronto para download!`,
            type: "certificate",
            link: `/academy/certificates`,
          });
        }
      }
    }

    await enrollment.save();

    // Criar notificação de atualização de progresso (se não completou 100%)
    if (newProgress < 100) {
      const course = await Course.findById(courseId);
      if (course) {
        await createNotification({
          userId: req.userId!,
          title: "Progresso atualizado",
          message: `Seu progresso no curso "${course.title}" foi atualizado! (${newProgress}% completo)`,
          type: "course",
          link: `/academy/course/${courseId}`,
        });
      }
    }

    res.json({
      success: true,
      message: "Progresso atualizado com sucesso!",
      enrollment,
    });
  } catch (error) {
    console.error("Update progress error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar progresso",
    });
  }
};

// Buscar certificados do usuário
export const getCertificates = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const certificates = await Certificate.find({ userId: req.userId })
      .populate("courseId", "title")
      .sort({ earnedAt: -1 });

    // Buscar cursos em progresso que podem gerar certificados
    const enrollments = await Enrollment.find({
      userId: req.userId,
      progress: { $lt: 100 },
    }).populate("courseId", "title duration");

    const inProgressCertificates = enrollments.map((enrollment: any) => {
      const course = enrollment.courseId;
      const hours = Math.floor(enrollment.studyTime / 60);
      const minutes = enrollment.studyTime % 60;
      const totalHours = Math.floor(course.duration / 60);
      const totalMinutes = course.duration % 60;
      
      return {
        id: enrollment._id.toString(),
        courseId: course._id.toString(),
        title: `Certificado de ${course.title}`,
        course: course.title,
        earnedAt: "-",
        studyTime: `${hours}h ${minutes}min / ${totalHours}h ${totalMinutes}min`,
        status: "in-progress",
      };
    });

    const earnedCertificates = certificates.map((cert) => {
      const hours = Math.floor(cert.studyTime / 60);
      const minutes = cert.studyTime % 60;
      
      return {
        id: cert._id.toString(),
        courseId: cert.courseId.toString(),
        title: cert.title,
        course: cert.courseName,
        earnedAt: cert.earnedAt.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        studyTime: `${hours}h ${minutes}min`,
        status: "earned",
        certificateUrl: cert.certificateUrl,
      };
    });

    res.json({
      success: true,
      certificates: {
        earned: earnedCertificates,
        inProgress: inProgressCertificates,
      },
    });
  } catch (error) {
    console.error("Get certificates error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar certificados",
    });
  }
};

// Buscar trilha de aprendizado
export const getLearningPath = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    // Buscar todos os cursos em ordem
    const courses = await Course.find({ status: "active" }).sort({ createdAt: 1 });
    const enrollments = await Enrollment.find({ userId: req.userId });

    // Criar um mapa de enrollments para busca rápida
    const enrollmentMap = new Map();
    enrollments.forEach((enrollment) => {
      enrollmentMap.set(enrollment.courseId.toString(), enrollment);
    });

    // Determinar status de cada curso
    const steps = courses.map((course, index) => {
      const courseId = course._id.toString();
      const enrollment = enrollmentMap.get(courseId);

      let status: "completed" | "current" | "locked" = "locked";
      
      // Se o curso está completo
      if (enrollment && enrollment.progress >= 100) {
        status = "completed";
      } 
      // Se o curso está em progresso (mas não completo)
      else if (enrollment && enrollment.progress > 0) {
        status = "current";
      }
      // Se não está inscrito ou não começou
      else {
        // Primeiro curso sempre disponível
        if (index === 0) {
          status = "current";
        } else {
          // Verificar se o curso anterior foi completado
          const previousCourse = courses[index - 1];
          const prevEnrollment = enrollmentMap.get(previousCourse._id.toString());
          
          if (prevEnrollment && prevEnrollment.progress >= 100) {
            // Curso anterior completo, este pode ser iniciado
            status = "current";
          } else {
            // Curso anterior não completo, este está bloqueado
            status = "locked";
          }
        }
      }

      return {
        title: course.title,
        status,
        courseId: courseId,
      };
    });

    // Calcular progresso geral da trilha
    // Progresso = (cursos completados / total de cursos) * 100
    // IMPORTANTE: Apenas cursos com progress >= 100% contam como completados
    // Verificar diretamente nos enrollments para garantir precisão
    const completedEnrollments = enrollments.filter(e => {
      const enrollmentProgress = e.progress || 0;
      return enrollmentProgress >= 100;
    });
    
    const completedCourses = completedEnrollments.length;
    const totalCourses = courses.length;
    const progress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    res.json({
      success: true,
      learningPath: {
        title: "Trilha: Especialista em IA",
        description: "Complete todos os módulos para se tornar um especialista em IA",
        progress: progress,
        steps,
      },
    });
  } catch (error) {
    console.error("Get learning path error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar trilha de aprendizado",
    });
  }
};

// Download do certificado
export const downloadCertificate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "ID do curso é obrigatório",
      });
    }

    // Buscar certificado com dados do curso (incluindo duração)
    const certificate = await Certificate.findOne({
      userId: req.userId,
      courseId,
    })
      .populate("courseId", "title duration")
      .populate("userId", "name email");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificado não encontrado",
      });
    }

    // Buscar dados do usuário
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Calcular horas de curso a partir da duração do curso (fallback para studyTime)
    const courseData: any = certificate.courseId;
    const courseDurationMinutes =
      (courseData && typeof courseData === "object" && "duration" in courseData
        ? courseData.duration
        : certificate.studyTime) || 0;

    // Converter para horas (arredondando para cima e garantindo pelo menos 1h)
    const courseHours =
      courseDurationMinutes <= 0
        ? 1
        : Math.max(1, Math.round(courseDurationMinutes / 60));

    // Gerar código de verificação simples baseado no ID do certificado e data
    const rawCode = `${certificate._id.toString()}-${certificate.createdAt.getTime()}`;
    const verificationCode = Buffer.from(rawCode)
      .toString("base64")
      .replace(/[^A-Z0-9]/gi, "")
      .slice(0, 12)
      .toUpperCase();

    // 1) Link de validação (ajuste pro seu domínio/rota)
    const certificateId = certificate.id || verificationCode; // usa um id real, se tiver
    const validationUrl = `https://SEU-DOMINIO.com/validar/${encodeURIComponent(certificateId)}`;

    // 2) Hash SHA-256 (use dados estáveis do certificado)
    const sha256Hash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          certificateId,
          userId: user.id || null,
          name: user.name || null,
          courseName: certificate.courseName || null,
          courseHours,
          earnedAt: certificate.earnedAt,
          verificationCode,
        })
      )
      .digest("hex");

    // 3) QR Code embutido como SVG
    const qrSvg = await QRCode.toString(validationUrl, {
      type: "svg",
      margin: 0,
      width: 140, // tamanho do QR
    });

    // Gerar HTML do certificado (com QR + ID + SHA-256)
    const certificateHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      
        <style>
          @page { size: A4 landscape; margin: 0; }
          * { box-sizing: border-box; }
      
          :root{
            --bg: #fbf7ef;
            --paper: #fffdf7;
            --ink: #1f2937;
            --muted: #6b7280;
            --line: rgba(31,41,55,.22);
            --accent: #4f46e5;
            --accent2: #f59e0b;
          }
      
          body{
            margin: 0;
            padding: 0;
            font-family: Georgia, "Times New Roman", serif;
            color: var(--ink);
            background: var(--bg);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
      
          .page{
            width: 297mm;
            height: 210mm;
            margin: 0 auto;
            display: grid;
            place-items: center;
            padding: 14mm;
          }
      
          .certificate{
            width: 100%;
            height: 100%;
            background: radial-gradient(1200px 500px at 40% 20%, rgba(79,70,229,.08), transparent 55%),
                        radial-gradient(900px 420px at 80% 75%, rgba(245,158,11,.10), transparent 55%),
                        var(--paper);
            position: relative;
            overflow: hidden;
            border-radius: 10px;
            box-shadow: 0 22px 60px rgba(0,0,0,.16);
          }
      
          .certificate::before{
            content:"";
            position:absolute;
            inset: 10mm;
            border: 2px solid var(--line);
            border-radius: 8px;
            pointer-events:none;
          }
          .certificate::after{
            content:"";
            position:absolute;
            inset: 6mm;
            border: 8px solid rgba(31,41,55,.9);
            border-radius: 10px;
            pointer-events:none;
          }
      
          .watermark{
            position:absolute;
            inset: 0;
            display:grid;
            place-items:center;
            pointer-events:none;
            opacity: .06;
            transform: rotate(-12deg);
            font-weight: 800;
            letter-spacing: 10px;
            font-size: 84px;
            text-transform: uppercase;
            color: var(--ink);
            user-select: none;
          }
      
          .ribbon{
            position:absolute;
            left:-60mm;
            top: 18mm;
            width: 200mm;
            height: 22mm;
            background: linear-gradient(90deg, rgba(79,70,229,.0), rgba(79,70,229,.18), rgba(79,70,229,.0));
            transform: rotate(-12deg);
            pointer-events:none;
          }
          .ribbon2{
            position:absolute;
            right:-70mm;
            bottom: 20mm;
            width: 230mm;
            height: 18mm;
            background: linear-gradient(90deg, rgba(245,158,11,.0), rgba(245,158,11,.18), rgba(245,158,11,.0));
            transform: rotate(-12deg);
            pointer-events:none;
          }
      
          .content{
            position: relative;
            height: 100%;
            padding: 18mm 20mm 14mm;
            display: grid;
            grid-template-rows: auto 1fr auto;
            gap: 10mm;
          }
      
          .header{
            display:flex;
            justify-content: space-between;
            align-items: center;
            gap: 12mm;
          }
      
          .brand{
            display:flex;
            flex-direction: column;
            gap: 2mm;
          }
          .logo{
            font-family: "Trebuchet MS", Arial, sans-serif;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: .8px;
            color: var(--accent);
            text-transform: uppercase;
          }
          .tag{
            font-family: "Trebuchet MS", Arial, sans-serif;
            font-size: 11px;
            letter-spacing: 2.2px;
            text-transform: uppercase;
            color: var(--muted);
          }
      
          .cert-title{
            text-align:right;
          }
          .cert-title h1{
            margin:0;
            font-size: 36px;
            letter-spacing: 6px;
            text-transform: uppercase;
          }
          .cert-title p{
            margin: 2mm 0 0;
            font-family: "Trebuchet MS", Arial, sans-serif;
            font-size: 12px;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: var(--muted);
          }
      
          .main{
            display:grid;
            place-items:center;
            text-align:center;
            padding: 0 10mm;
          }
      
          .line{
            font-family: "Trebuchet MS", Arial, sans-serif;
            font-size: 14px;
            color: var(--muted);
            letter-spacing: 1px;
            margin: 0 0 4mm;
          }
      
          .name{
            margin: 0;
            padding: 3mm 10mm;
            font-size: 46px;
            line-height: 1.05;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
      
            border-bottom: 2px solid rgba(31,41,55,.45);
            display: inline-block;
            max-width: 95%;
            word-wrap: break-word;
          }
      
          .desc{
            margin: 6mm 0 2mm;
            font-size: 18px;
            color: var(--ink);
          }
      
          .course{
            margin: 2mm 0 2mm;
            font-size: 26px;
            font-weight: 700;
            color: var(--ink);
          }
      
          .meta{
            margin-top: 4mm;
            font-family: "Trebuchet MS", Arial, sans-serif;
            font-size: 13px;
            color: var(--muted);
            display:flex;
            gap: 10mm;
            flex-wrap: wrap;
            justify-content: center;
          }
          .pill{
            padding: 0;
            border-radius: 0;
            border: none;
            background: transparent;
          }
          .pill b{ 
            color: var(--ink);
            font-weight: 600;
          }
      
          /* Selo */
          /* Rodapé */
          .footer{
            display:flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 10mm;
            padding-top: 6mm;
            border-top: 1px solid rgba(31,41,55,.18);
          }
      
          .signatures{
            display:flex;
            gap: 16mm;
            align-items:flex-end;
          }
          .signature{
            text-align:center;
            min-width: 64mm;
          }
          .sig-line{
            border-top: 2px solid rgba(31,41,55,.65);
            width: 64mm;
            margin: 6mm auto 2mm;
          }
          .sig-handwrite{
            font-family: "Brush Script MT", "Segoe Script", cursive;
            font-size: 18px;
            color: var(--ink);
            margin-top: 4mm;
          }
          .sig-handwrite-bridge{
            font-size: 20px;
            letter-spacing: 1px;
          }
          .sig-role{
            font-family: "Trebuchet MS", Arial, sans-serif;
            font-size: 12px;
            color: var(--ink);
            font-weight: 700;
          }
          .sig-org{
            font-family: "Trebuchet MS", Arial, sans-serif;
            font-size: 11px;
            color: var(--muted);
            margin-top: 1mm;
          }
      
          .verification{
            text-align:right;
            font-family: "Trebuchet MS", Arial, sans-serif;
            font-size: 11px;
            color: var(--muted);
            max-width: 95mm;
          }
          .verification b{
            color: var(--ink);
            letter-spacing: .6px;
            word-break: break-all;
          }
          .tiny{
            margin-top: 2mm;
            font-size: 10px;
            color: rgba(107,114,128,.95);
            line-height: 1.35;
          }
      
          @media print{
            body{ background: white; }
            .page{ padding: 0; width: 297mm; height: 210mm; }
            .certificate{ box-shadow: none; border-radius: 0; }
          }
        </style>
      </head>
      
      <body>
        <div class="page">
            <div class="certificate">
            <div class="watermark">BridgeAI Hub</div>
            <div class="ribbon"></div>
            <div class="ribbon2"></div>
      
            <div class="content">
              <div class="header">
                <div class="brand">
                  <div class="logo">BridgeAI Hub</div>
                  <div class="tag">Certificação Oficial</div>
                </div>
      
                <div class="cert-title">
                  <h1>Certificado</h1>
                  <p>de conclusão</p>
                </div>
              </div>
      
              <div class="main">
                <p class="line">Certificamos que</p>
                <h2 class="name">${(user.name || "Aluno(a)").toUpperCase()}</h2>
      
                <p class="desc">concluiu com êxito o curso</p>
                <div class="course">${certificate.courseName || ""}</div>
      
                <div class="meta">
                  <div class="pill">Carga horária: <b>${courseHours}h</b></div>
                  <div class="pill">
                    Data: <b>${new Date(certificate.earnedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}</b>
                  </div>
                </div>
              </div>
      
              <div class="footer">
                <div class="signatures">
                  <!-- Assinatura do aluno -->
                  <div class="signature">
                    <div class="sig-handwrite">
                      ${(user.name || "Aluno(a)").toUpperCase()}
                    </div>
                    <div class="sig-line"></div>
                    <div class="sig-role">Aluno(a)</div>
                    <div class="sig-org">Instituição: BridgeAI Hub</div>
                  </div>

                  <!-- Assinatura institucional BridgeAI -->
                  <div class="signature">
                    <div class="sig-handwrite sig-handwrite-bridge">
                      BridgeAI
                    </div>
                    <div class="sig-line"></div>
                    <div class="sig-role">Instituição BridgeAI</div>
                    <div class="sig-org">BridgeAI Hub</div>
                  </div>
                </div>
      
                <!-- Antifraude -->
                <div class="verification">
                  Código de verificação:<br/>
                  <b>${verificationCode}</b>
      
                  <div class="tiny">
                    ID do certificado: <b>${certificateId}</b><br/>
                    Hash (SHA-256): <b>${sha256Hash}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
      `;

    // Configurar headers para download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${certificate.courseName.replace(/\s+/g, '-')}.html"`);
    
    res.send(certificateHtml);
  } catch (error) {
    console.error("Download certificate error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar certificado",
    });
  }
};

// Schemas de validação para consultoria
const scheduleSessionSchema = z.object({
  sessionId: z.string().min(1, "ID da sessão é obrigatório"),
});

// Buscar sessões de consultoria
export const getConsultingSessions = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const { type } = req.query; // "upcoming" ou "past"

    let filter: any = {};

    // Normalizar comparação de datas em UTC para evitar problemas de fuso horário
    const startOfTodayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    
    if (type === "upcoming") {
      // Sessões futuras ou hoje
      filter = {
        $or: [
          // Datas depois de hoje
          { date: { $gt: startOfTodayUtc } },
          // Hoje, mas ainda não começou (compara pelo campo time)
          {
            date: startOfTodayUtc,
            time: { $gte: now.toTimeString().slice(0, 5) },
          },
        ],
        status: { $in: ["scheduled", "available", "full"] },
      };
    } else if (type === "past") {
      // Sessões passadas
      filter = {
        $or: [
          // Datas antes de hoje
          { date: { $lt: startOfTodayUtc } },
          // Hoje, mas já passou do horário
          {
            date: startOfTodayUtc,
            time: { $lt: now.toTimeString().slice(0, 5) },
          },
          { status: { $in: ["completed", "cancelled"] } },
        ],
      };
    }

    const sessions = await ConsultingSession.find(filter)
      .sort({ date: type === "upcoming" ? 1 : -1, time: type === "upcoming" ? 1 : -1 })
      .populate("participants", "name email")
      .limit(50);

    // Verificar se o usuário está inscrito em cada sessão
    const sessionsWithEnrollment = sessions.map((session) => {
      const isEnrolled = session.participants.some(
        (p: any) => p._id.toString() === req.userId?.toString()
      );

      return {
        id: session._id.toString(),
        title: session.title,
        description: session.description,
        date: session.date,
        time: session.time,
        duration: session.duration,
        participants: session.currentParticipants,
        maxParticipants: session.maxParticipants,
        status: session.status,
        instructor: session.instructor,
        platform: session.platform,
        meetingLink: session.meetingLink,
        isEnrolled,
      };
    });

    res.json({
      success: true,
      sessions: sessionsWithEnrollment,
    });
  } catch (error) {
    console.error("Get consulting sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar sessões de consultoria",
    });
  }
};

// Inscrever-se em uma sessão
export const scheduleSession = async (req: AuthRequest, res: Response) => {
  try {
    const data = scheduleSessionSchema.parse(req.body);
    const session = await ConsultingSession.findById(data.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Sessão não encontrada",
      });
    }

    // Verificar se já está inscrito
    const isAlreadyEnrolled = session.participants.some(
      (p) => p.toString() === req.userId?.toString()
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: "Você já está inscrito nesta sessão",
      });
    }

    // Verificar se há vagas
    if (session.currentParticipants >= session.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Esta sessão está lotada",
      });
    }

    // Verificar se a sessão ainda está disponível
    if (session.status !== "available" && session.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Esta sessão não está mais disponível para inscrição",
      });
    }

    // Adicionar participante (convertendo string para ObjectId)
    session.participants.push(new mongoose.Types.ObjectId(req.userId!));
    session.currentParticipants += 1;

    // Atualizar status se lotou
    if (session.currentParticipants >= session.maxParticipants) {
      session.status = "full";
    }

    await session.save();

    // Criar notificação
    await createNotification({
      userId: req.userId!,
      title: "Inscrição confirmada",
      message: `Você foi inscrito na sessão "${session.title}"`,
      type: "success",
      link: "/academy/consulting",
    });

    res.json({
      success: true,
      message: "Inscrição realizada com sucesso!",
      session: {
        id: session._id.toString(),
        title: session.title,
        date: session.date,
        time: session.time,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
      });
    }

    console.error("Schedule session error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao inscrever-se na sessão",
    });
  }
};

// Cancelar inscrição em uma sessão
export const cancelSession = async (req: AuthRequest, res: Response) => {
  try {
    const data = scheduleSessionSchema.parse(req.body);
    const session = await ConsultingSession.findById(data.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Sessão não encontrada",
      });
    }

    // Verificar se está inscrito
    const participantIndex = session.participants.findIndex(
      (p) => p.toString() === req.userId?.toString()
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Você não está inscrito nesta sessão",
      });
    }

    // Verificar se a sessão já foi concluída (não pode mais cancelar)
    const sessionDate = new Date(session.date);
    const [hours, minutes] = session.time.split(":").map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);

    const startTime = sessionDate.getTime();
    const endTime = startTime + session.duration * 60 * 1000;
    const nowTime = Date.now();

    if (nowTime > endTime || session.status === "completed" || session.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Esta sessão já foi concluída ou cancelada. Não é mais possível cancelar a inscrição.",
      });
    }

    // Remover participante
    session.participants.splice(participantIndex, 1);
    if (session.currentParticipants > 0) {
      session.currentParticipants -= 1;
    }

    // Se estava lotada e agora tem vaga, atualizar status para available
    if (session.status === "full" && session.currentParticipants < session.maxParticipants) {
      session.status = "available";
    }

    await session.save();

    await createNotification({
      userId: req.userId!,
      title: "Inscrição cancelada",
      message: `Sua inscrição na sessão "${session.title}" foi cancelada.`,
      type: "info",
      link: "/academy/consulting",
    });

    res.json({
      success: true,
      message: "Inscrição cancelada com sucesso.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
      });
    }

    console.error("Cancel session error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao cancelar inscrição na sessão",
    });
  }
};

