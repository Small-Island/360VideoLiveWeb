class RobotSwitchToggleButton {
  static createButton() {
    const button = document.createElement("button");

    button.style.display = "";

    button.style.cursor = "pointer";
    button.style.left = "calc(50% - 50px)";
    button.style.width = "150px";

    button.onmouseenter = function () {
      button.style.opacity = "1.0";
    };

    button.onmouseleave = function () {
      button.style.opacity = "0.5";
    };

    button.onclick = function () {
      console.log("hoge");
      location.reload();
    };

    function stylizeElement(element) {
      element.style.position = "absolute";
      element.style.top = "20px";
      element.style.padding = "12px 6px";
      element.style.border = "1px solid #fff";
      element.style.borderRadius = "4px";
      element.style.background = "rgba(0,0,0,0.5)";
      element.style.color = "#fff";
      element.style.font = "normal 15px sans-serif";
      element.style.textAlign = "center";
      element.style.opacity = "0.5";
      element.style.outline = "none";
      element.style.zIndex = "999";
    }

    button.id = "RobotSwitchToggleButton";
    button.textContent = "Switch Robot";
    button.style.cursor = "pointer";
    button.style.left = "calc(50% - 50px)";
    button.style.width = "100px";
    button.onmouseenter = function () {
      button.style.opacity = "1.0";
    };
    button.onmouseleave = function () {
      button.style.opacity = "0.5";
    };
    stylizeElement(button);

    return button;
  }
}

export { RobotSwitchToggleButton };
