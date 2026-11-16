export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/health") {
      return new Response("CVStudio staging worker. Health: /health", {
        status: 200,
        headers: {"content-type":"text/plain; charset=utf-8","cache-control":"no-store","x-robots-tag":"noindex, nofollow"}
      });
    }
    return Response.json({project:"CVStudio",environment:"pruebas",status:"ok",deployedBy:"github-actions",revision:"account-id-corrected"}, {
      headers: {"cache-control":"no-store","x-robots-tag":"noindex, nofollow"}
    });
  }
};
