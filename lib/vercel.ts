export async function deployVercelProject(subdomain: string, cbfApiKey: string) {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const cbfApiUrl = process.env.CBF_API_BASE_URL;
  if (!token || !cbfApiUrl) return;

  const teamQuery = teamId ? `?teamId=${teamId}` : "";

  try {
    const createRes = await fetch(`https://api.vercel.com/v10/projects${teamQuery}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `homepty-${subdomain}`,
        gitRepository: { type: "github", repo: "LaloVO/Agencia-template-CBF" },
        framework: "vite",
        environmentVariables: [
          { key: "VITE_CBF_API_URL", value: cbfApiUrl, target: ["production"] },
          { key: "VITE_CBF_API_KEY", value: cbfApiKey, target: ["production"] },
        ],
      }),
    });

    const project = await createRes.json();
    if (!project.id) {
      console.error("Error creando proyecto Vercel:", project);
      return;
    }

    await fetch(`https://api.vercel.com/v10/projects/${project.id}/domains${teamQuery}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: `${subdomain}.homepty.com` }),
    });
  } catch (err) {
    console.error("Error en deploy Vercel:", err);
  }
}
