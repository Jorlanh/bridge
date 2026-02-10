import { Response } from "express";
import { AuthRequest, isAdmin } from "../middleware/auth.js";
import os from "os";

/**
 * Obter informações de sistema e hardware (apenas admin/master)
 */
export const getSystemInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
    }

    // Informações do sistema operacional
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    const type = os.type();
    const release = os.release();
    const uptime = os.uptime();

    // Informações de CPU
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || "Desconhecido";
    const cpuCores = cpus.length;
    const cpuSpeed = cpus[0]?.speed || 0;

    // Informações de memória
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Informações de rede
    const networkInterfaces = os.networkInterfaces();
    const networkInfo: any[] = [];
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        interfaces.forEach((iface) => {
          if (iface.family === "IPv4" && !iface.internal) {
            networkInfo.push({
              name: interfaceName,
              address: iface.address,
              netmask: iface.netmask,
            });
          }
        });
      }
    });

    // Informações de carga do sistema (load average)
    const loadAvg = os.loadavg();

    // Informações de usuários do sistema
    const userInfo = os.userInfo();

    res.json({
      success: true,
      system: {
        platform,
        arch,
        hostname,
        type,
        release,
        uptime: Math.floor(uptime / 3600), // em horas
        uptimeSeconds: uptime,
      },
      cpu: {
        model: cpuModel,
        cores: cpuCores,
        speed: cpuSpeed,
        loadAverage: loadAvg,
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercent: memoryUsagePercent.toFixed(2),
        totalGB: (totalMemory / (1024 * 1024 * 1024)).toFixed(2),
        freeGB: (freeMemory / (1024 * 1024 * 1024)).toFixed(2),
        usedGB: (usedMemory / (1024 * 1024 * 1024)).toFixed(2),
      },
      network: networkInfo,
      user: {
        username: userInfo.username,
        homedir: userInfo.homedir,
      },
    });
  } catch (error) {
    console.error("Get system info error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar informações do sistema",
    });
  }
};

