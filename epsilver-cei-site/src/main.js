import "./styles.css";
import { renderApp } from "./router.js";

renderApp();
window.addEventListener("hashchange", renderApp);