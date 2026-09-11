import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Busca os dados brutos de abastecimento na API externa.
 * Enquanto a integração real não está configurada (sem token/credenciais),
 * cai automaticamente para os dados de exemplo em data/sample-fuellings.json,
 * o que permite desenvolver o front-end sem depender da API.
 *
 * Quando a API real estiver pronta, basta preencher as variáveis de ambiente
 * FUEL_API_BASE_URL, FUEL_API_USERNAME, FUEL_API_PASSWORD, FUEL_API_HASHCOD
 * (mesmo padrão de autenticação usado no Signal Guard com a API SSX).
 */
async function buscarAbastecimentos({ accessToken } = {}) {
  const baseUrl = process.env.FUEL_API_BASE_URL;

  if (!baseUrl || !accessToken) {
    return lerDadosDeExemplo();
  }

  try {
    const response = await axios.get(`${baseUrl}/api/fuellings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (err) {
    console.error("Falha ao consultar API externa, usando dados de exemplo:", err.message);
    return lerDadosDeExemplo();
  }
}

function lerDadosDeExemplo() {
  const filePath = path.join(__dirname, "..", "data", "sample-fuellings.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export { buscarAbastecimentos };
