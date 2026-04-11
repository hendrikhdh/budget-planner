import { Icon } from "./Icon.jsx";
import { monthName } from "../utils/helpers.js";

const navBtnBase = {
  minWidth: 44, minHeight: 44, padding: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  WebkitTapHighlightColor: "transparent",
};

export const MonthNav = ({ viewMonth, viewYear, prevMonth, nextMonth, goToday, T, btnSecondary }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "16px 0" }}>
    <button onClick={prevMonth} aria-label="Vorheriger Monat" style={{ ...btnSecondary, ...navBtnBase, borderRadius: "50%" }}>
      <Icon name="left" size={20}/>
    </button>
    <span style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, minWidth: 160, textAlign: "center" }}>
      {monthName(viewMonth, viewYear)}
    </span>
    <button onClick={nextMonth} aria-label="Nächster Monat" style={{ ...btnSecondary, ...navBtnBase, borderRadius: "50%" }}>
      <Icon name="right" size={20}/>
    </button>
    <button onClick={goToday} style={{ ...btnSecondary, ...navBtnBase, padding: "0 16px", fontSize: 13, fontWeight: 700, borderRadius: 22 }}>
      Heute
    </button>
  </div>
);
