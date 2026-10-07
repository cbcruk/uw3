import "./style.css";
import { mountGame } from "./ui/game-view/game-view";
import { mountApp } from "./ui/app";

const root = document.querySelector<HTMLDivElement>("#app");
if (root === null) {
  throw new Error("#app not found");
}

// 기본 화면은 로그라이크 레이어다. 시뮬레이터는 `#sim`으로 연다.
if (window.location.hash === "#sim") {
  mountApp(root);
} else {
  mountGame(root);
}
window.addEventListener("hashchange", () => window.location.reload());
