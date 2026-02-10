import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Workflow } from "../models/Workflow.js";
import { Task } from "../models/Task.js";
import { Checklist } from "../models/Checklist.js";
import { createNotification } from "../utils/notifications.js";

// Buscar todos os fluxos
export const getWorkflows = async (req: AuthRequest, res: Response) => {
  try {
    const workflows = await Workflow.find({ userId: req.userId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      workflows: workflows.map(workflow => ({
        id: workflow._id.toString(),
        name: workflow.name,
        status: workflow.status,
        steps: workflow.steps,
        completed: workflow.completed,
        avgTime: workflow.avgTime,
        efficiency: workflow.efficiency,
      })),
    });
  } catch (error) {
    console.error("Get workflows error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar fluxos",
    });
  }
};

// Criar novo fluxo
export const createWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { name, steps } = req.body;

    if (!name || !steps) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: name, steps",
      });
    }

    const workflow = new Workflow({
      name,
      steps,
      userId: req.userId,
    });

    await workflow.save();

    res.status(201).json({
      success: true,
      workflow: {
        id: workflow._id.toString(),
        name: workflow.name,
        status: workflow.status,
        steps: workflow.steps,
        completed: workflow.completed,
        avgTime: workflow.avgTime,
        efficiency: workflow.efficiency,
      },
    });
  } catch (error) {
    console.error("Create workflow error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar fluxo",
    });
  }
};

// Atualizar fluxo
export const updateWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const workflow = await Workflow.findOne({ _id: id, userId: req.userId });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Fluxo não encontrado",
      });
    }

    if (updateData.name) workflow.name = updateData.name;
    if (updateData.status) workflow.status = updateData.status;
    if (updateData.steps !== undefined) workflow.steps = updateData.steps;
    if (updateData.completed !== undefined) workflow.completed = updateData.completed;
    if (updateData.avgTime) workflow.avgTime = updateData.avgTime;
    if (updateData.efficiency !== undefined) workflow.efficiency = updateData.efficiency;

    await workflow.save();

    // Criar notificação de atualização
    await createNotification({
      userId: req.userId!,
      title: "Fluxo atualizado",
      message: `O fluxo "${workflow.name}" foi atualizado com sucesso!`,
      type: "success",
      link: "/dashboard/processes",
    });

    res.json({
      success: true,
      workflow: {
        id: workflow._id.toString(),
        name: workflow.name,
        status: workflow.status,
        steps: workflow.steps,
        completed: workflow.completed,
        avgTime: workflow.avgTime,
        efficiency: workflow.efficiency,
      },
    });
  } catch (error) {
    console.error("Update workflow error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar fluxo",
    });
  }
};

// Buscar todas as tarefas
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority } = req.query;
    const filter: any = { userId: req.userId };
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ dueDate: 1 });
    
    res.json({
      success: true,
      tasks: tasks.map(task => ({
        id: task._id.toString(),
        title: task.title,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo,
        status: task.status,
      })),
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar tarefas",
    });
  }
};

// Criar nova tarefa
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, priority, dueDate, assignedTo } = req.body;

    if (!title || !category || !dueDate || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: title, category, dueDate, assignedTo",
      });
    }

    const task = new Task({
      title,
      category,
      priority: priority || "medium",
      dueDate: new Date(dueDate),
      assignedTo,
      userId: req.userId,
    });

    await task.save();

    res.status(201).json({
      success: true,
      task: {
        id: task._id.toString(),
        title: task.title,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo,
        status: task.status,
      },
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar tarefa",
    });
  }
};

// Atualizar tarefa
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const task = await Task.findOne({ _id: id, userId: req.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Tarefa não encontrada",
      });
    }

    if (updateData.title) task.title = updateData.title;
    if (updateData.category) task.category = updateData.category;
    if (updateData.priority) task.priority = updateData.priority;
    if (updateData.dueDate) task.dueDate = new Date(updateData.dueDate);
    if (updateData.assignedTo) task.assignedTo = updateData.assignedTo;
    if (updateData.status) task.status = updateData.status;

    await task.save();

    // Criar notificação de atualização
    await createNotification({
      userId: req.userId!,
      title: "Tarefa atualizada",
      message: `A tarefa "${task.title}" foi atualizada com sucesso!`,
      type: "success",
      link: "/dashboard/processes",
    });

    res.json({
      success: true,
      task: {
        id: task._id.toString(),
        title: task.title,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo,
        status: task.status,
      },
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar tarefa",
    });
  }
};

// Buscar checklists
export const getChecklists = async (req: AuthRequest, res: Response) => {
  try {
    const checklists = await Checklist.find({ userId: req.userId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      checklists: checklists.map(checklist => ({
        id: checklist._id.toString(),
        name: checklist.name,
        items: checklist.items,
        completed: checklist.completed,
        category: checklist.category,
      })),
    });
  } catch (error) {
    console.error("Get checklists error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar checklists",
    });
  }
};

// Criar checklist
export const createChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const { name, items, category } = req.body;

    if (!name || !items || !category) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: name, items, category",
      });
    }

    const checklist = new Checklist({
      name,
      items,
      category,
      userId: req.userId,
    });

    await checklist.save();

    res.status(201).json({
      success: true,
      checklist: {
        id: checklist._id.toString(),
        name: checklist.name,
        items: checklist.items,
        completed: checklist.completed,
        category: checklist.category,
      },
    });
  } catch (error) {
    console.error("Create checklist error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar checklist",
    });
  }
};

// Atualizar checklist
export const updateChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const checklist = await Checklist.findOne({ _id: id, userId: req.userId });

    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: "Checklist não encontrado",
      });
    }

    if (completed !== undefined) checklist.completed = completed;

    await checklist.save();

    // Criar notificação de atualização
    await createNotification({
      userId: req.userId!,
      title: "Checklist atualizado",
      message: `O checklist "${checklist.name}" foi atualizado com sucesso!`,
      type: "success",
      link: "/dashboard/processes",
    });

    res.json({
      success: true,
      checklist: {
        id: checklist._id.toString(),
        name: checklist.name,
        items: checklist.items,
        completed: checklist.completed,
        category: checklist.category,
      },
    });
  } catch (error) {
    console.error("Update checklist error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar checklist",
    });
  }
};

// Estatísticas de processos
export const getProcessesStats = async (req: AuthRequest, res: Response) => {
  try {
    const workflows = await Workflow.find({ userId: req.userId });
    const tasks = await Task.find({ userId: req.userId });
    
    const activeWorkflows = workflows.filter(w => w.status === "active").length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const totalTasks = tasks.length;
    const avgEfficiency = workflows.length > 0
      ? workflows.reduce((sum, w) => sum + w.efficiency, 0) / workflows.length
      : 0;

    res.json({
      success: true,
      stats: {
        activeWorkflows,
        completedTasks,
        totalTasks,
        avgEfficiency: Math.round(avgEfficiency * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Get processes stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas",
    });
  }
};


