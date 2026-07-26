import "./style.css";
import { mountApp } from "./ui/app";

const root = document.querySelector<HTMLDivElement>("#app");
if (root === null) {
  throw new Error("#app not found");
}

mountApp(root);
