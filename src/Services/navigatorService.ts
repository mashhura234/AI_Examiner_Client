import type { NavigateFunction } from "react-router-dom";

let navigator: NavigateFunction | null = null;

export const setNavigator = (nav: NavigateFunction) => {
  navigator = nav;
};

export const navigateTo = (path: string) => {
  if (navigator) {
    navigator(path);
  }
};