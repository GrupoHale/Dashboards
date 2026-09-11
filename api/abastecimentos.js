const TOKEN =
  "%2FJSzMpCRi2lb23Dva2CfPsNdNDEynnzTpf242Ju8zwkwziDOC1afok%2BRB4dl8dojUTsFs%2BeNUMrG6av1t4GWzoI%2FacnVjzuCzFLT82nPXLwdJva%2BysCaJwnPu8dfNnS1NRE4jogGx1zWJvV91yCLoczeXao1IpGf87y%2B5DKg95seudit5b3jUPi%2FCvIOD3y6Z01TMXskHigPzxfZIR4iwN1tOEJGcoR7C2PX%2FbqxVo%2B37jVePW0fEfOK9zqUuE1LHZIupRCvVc9pqLS00BZHCkjRF6rvHiXTF0emMbbJB0dOr5DIUCPQLLHcKYH71ecPnq8jC%2FQg3JLM0L%2B5CSq6JxDRX%2BDvju8BnKD%2Fhc8aPg6rotuaJ%2FLQmF9ZzSCZWT4sdu%2FRdTSTyssSvJOh9UzHRVTRP1KpLgM77USGPG4KorIA3Q8klKaRNDGmC0eRv8BW";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const dados = req.body;

    const resposta = await fetch("https://integration.systemsatx.com.br/Tracking/Fuel/List", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(dados),
    });

    if (!resposta.ok) {
      const erroApi = await resposta.text();
      console.error("Erro na API do SSX:", erroApi);
      return res.status(resposta.status).json({ error: "Erro na API do SSX" });
    }

    const dadosAPI = await resposta.json();
    res.status(201).json(dadosAPI);
  } catch (error) {
    console.error("Erro ao processar POST:", error);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}