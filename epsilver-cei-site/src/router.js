import { HomePage } from "./pages/home.js";
import { ProfilePage } from "./pages/profile.js";
import { ComparePage } from "./pages/compare.js";
import { SelfAssessmentPage } from "./pages/selfAssessment.js";
import { MethodologyPage } from "./pages/methodology.js";
import { mountLayout } from "./pages/layout.js";

function parseRoute() {
  const raw = (location.hash || "#/").replace(/^#/, "");
  const [path, qs = ""] = raw.split("?");

  const parts = path.split("/").filter(Boolean);

  if (parts.length === 0) return { name: "home", params: {} };

  if (parts[0] === "profile" && parts[1]) {
    return { name: "profile", params: { slug: parts[1] } };
  }

  if (parts[0] === "compare") {
    const sp = new URLSearchParams(qs);
    return { name: "compare", params: { a: sp.get("a") || "", b: sp.get("b") || "" } };
  }

  if (parts[0] === "self-assessment") {
    return { name: "self-assessment", params: {} };
  }

  if (parts[0] === "methodology") {
    return { name: "methodology", params: {} };
  }

  return { name: "home", params: {} };
}

export async function renderApp() {
  const route = parseRoute();

  const app = document.querySelector("#app");
  app.innerHTML = "";
  mountLayout(app, route.name);

  const outlet = document.querySelector("#outlet");
  if (!outlet) return;

  if (route.name === "home") return HomePage(outlet);
  if (route.name === "profile") return ProfilePage(outlet, route.params);
  if (route.name === "compare") return ComparePage(outlet, route.params);
  if (route.name === "self-assessment") return SelfAssessmentPage(outlet);
  if (route.name === "methodology") return MethodologyPage(outlet);
}