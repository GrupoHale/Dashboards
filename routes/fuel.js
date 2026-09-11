import { Router } from "express";
import NodeCache from "node-cache";
import { buscarAbastecimentos } from "../services/fuelApiClient.js";
import { montarDashboard } from "../services/fuelAnalytics.js";

const router = Router();
const cache = new NodeCache({
  stdTTL: Number(process.env.CACHE_TTL_SECONDS || 300),
});

/**
 * GET /api/fuel/dashboard?startDate=2026-08-01&endDate=2026-08-31
 * Retorna resumo, ranking por veículo e série temporal, prontos pro front.
 */
router.get("/dashboard", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const cacheKey = `dashboard:${startDate || "all"}:${endDate || "all"}`;

    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const fuellings = await buscarAbastecimentos({
      accessToken: req.headers["x-fuel-access-token"],
    });
    const dashboard = montarDashboard(fuellings, { startDate, endDate });

    cache.set(cacheKey, dashboard);
    res.json(dashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao montar dashboard de combustível." });
  }
});

/**
 * GET /api/fuel/raw
 * Retorna os dados brutos (útil pra debug ou exportação).
 */
router.get("/raw", async (req, res) => {
  try {
    const fuellings = await buscarAbastecimentos({
      accessToken: req.headers["x-fuel-access-token"],
    });
    res.json(fuellings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar dados de combustível." });
  }
});

export default router;
