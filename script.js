
const display = document.getElementById("display");
const buttons = document.querySelector(".buttons");

buttons.addEventListener("click", function (event) {
    const button = event.target;

    if (button.tagName !== "BUTTON") return;

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (action === "clear") {
        display.value = "";
        return;
    }

    if (action === "delete") {
        display.value = display.value.slice(0, -1);
        return;
    }

    if (action === "calculate") {
        try {
            const expression = display.value;

            if (!expression || !/^[0-9+\-*/.()\s]+$/.test(expression)) {
                throw new Error("Invalid expression");
            }

            const result = Function(
                '"use strict"; return (' + expression + ')'
            )();

            if (!Number.isFinite(result)) {
                throw new Error("Invalid result");
            }

            display.value = Number(result.toPrecision(12));
        } catch {
            display.value = "Error";
        }
        return;
    }

    if (value !== undefined && display.value !== "Error") {
        display.value += value;
    }
});
