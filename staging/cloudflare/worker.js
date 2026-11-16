export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "x-content-type-options": "nosniff"
    };
    if (url.pathname === "/health") {
      return Response.json({
        project: "CVStudio",
        environment: "pruebas",
        status: "ok",
        deployedBy: "github-actions",
        preview: "read-only"
      }, {headers});
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Preview de solo lectura", {status: 405, headers});
    }
    const response = await env.ASSETS.fetch(request);
    const result = new Response(response.body, response);
    for (const [key, value] of Object.entries(headers)) result.headers.set(key, value);
    if (url.pathname === "/" || url.pathname.endsWith(".html")) {
      result.headers.set("content-security-policy", "default-src 'none'; script-src 'none'; connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; img-src 'self' data: https:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; base-uri 'none'");
    }
    return result;
  }
};
