import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Post } from "../models/Post.js";
import { createNotification } from "../utils/notifications.js";

// Buscar todos os posts
export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { status, platform } = req.query;
    const filter: any = { userId: req.userId };
    
    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    const posts = await Post.find(filter).sort({ scheduledDate: -1, createdAt: -1 });
    
    res.json({
      success: true,
      posts: posts.map(post => ({
        id: post._id.toString(),
        content: post.content,
        platform: post.platform,
        scheduledDate: post.scheduledDate,
        status: post.status,
        image: post.image,
        imageUrl: post.imageUrl,
        engagement: post.engagement,
        createdAt: post.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar posts",
    });
  }
};

// Criar novo post
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, platform, scheduledDate, status, image } = req.body;
    const imageUrl = req.file ? `/uploads/posts/${req.file.filename}` : undefined;

    if (!content || !platform) {
      // Se houver arquivo enviado mas erro na validação, deletar
      if (req.file) {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: content, platform",
      });
    }

    // Normalizar plataforma para minúscula
    const normalizedPlatform = platform.toLowerCase();

    const post = new Post({
      content,
      platform: normalizedPlatform,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      status: status || "draft",
      image: image || !!imageUrl,
      imageUrl: imageUrl,
      userId: req.userId,
    });

    await post.save();

    res.status(201).json({
      success: true,
      post: {
        id: post._id.toString(),
        content: post.content,
        platform: post.platform,
        scheduledDate: post.scheduledDate,
        status: post.status,
        image: post.image,
        imageUrl: post.imageUrl,
        engagement: post.engagement,
      },
    });
  } catch (error) {
    // Deletar arquivo em caso de erro
    if (req.file) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error("Erro ao deletar arquivo:", e);
      }
    }
    console.error("Create post error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar post",
    });
  }
};

// Atualizar post
export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const imageUrl = req.file ? `/uploads/posts/${req.file.filename}` : undefined;

    const post = await Post.findOne({ _id: id, userId: req.userId });

    if (!post) {
      // Se houver arquivo enviado mas post não encontrado, deletar
      if (req.file) {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({
        success: false,
        message: "Post não encontrado",
      });
    }

    // Deletar imagem antiga se uma nova foi enviada
    if (imageUrl && post.imageUrl) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const oldImagePath = path.join(process.cwd(), post.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (e) {
        console.error("Erro ao deletar imagem antiga:", e);
      }
    }

    if (updateData.content) post.content = updateData.content;
    if (updateData.platform) post.platform = updateData.platform.toLowerCase();
    if (updateData.scheduledDate) post.scheduledDate = new Date(updateData.scheduledDate);
    if (updateData.status) post.status = updateData.status;
    if (updateData.image !== undefined) post.image = updateData.image;
    if (imageUrl) {
      post.imageUrl = imageUrl;
      post.image = true;
    }
    if (updateData.engagement) post.engagement = updateData.engagement;

    await post.save();

    // Criar notificação de atualização
    await createNotification({
      userId: req.userId!,
      title: "Post atualizado",
      message: `Seu post para ${post.platform} foi atualizado com sucesso!`,
      type: "success",
      link: "/dashboard/social",
    });

    res.json({
      success: true,
      post: {
        id: post._id.toString(),
        content: post.content,
        platform: post.platform,
        scheduledDate: post.scheduledDate,
        status: post.status,
        image: post.image,
        imageUrl: post.imageUrl,
        engagement: post.engagement,
      },
    });
  } catch (error) {
    // Deletar arquivo em caso de erro
    if (req.file) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error("Erro ao deletar arquivo:", e);
      }
    }
    console.error("Update post error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar post",
    });
  }
};

// Deletar post
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const post = await Post.findOneAndDelete({ _id: id, userId: req.userId });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Post deletado com sucesso",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar post",
    });
  }
};

// Gerar post com IA
export const generatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { theme, platform, tone } = req.body;

    if (!theme || !platform) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: theme, platform",
      });
    }

    const { generateSocialPost } = await import("../utils/gemini.js");
    const result = await generateSocialPost(theme, platform, tone || "Profissional");

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao gerar post",
      });
    }

    res.json({
      success: true,
      content: result.content,
    });
  } catch (error) {
    console.error("Generate post error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar post",
    });
  }
};

// Estatísticas de redes sociais
export const getSocialStats = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await Post.find({ userId: req.userId });
    
    const scheduledPosts = posts.filter(p => p.status === "scheduled").length;
    const totalEngagement = posts.reduce((sum, p) => {
      if (p.engagement) {
        return sum + (p.engagement.likes || 0) + (p.engagement.comments || 0) + (p.engagement.shares || 0);
      }
      return sum;
    }, 0);
    const totalViews = posts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0);
    const publishedPosts = posts.filter(p => p.status === "published").length;

    res.json({
      success: true,
      stats: {
        scheduledPosts,
        totalEngagement,
        totalViews,
        publishedPosts,
      },
    });
  } catch (error) {
    console.error("Get social stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas",
    });
  }
};


