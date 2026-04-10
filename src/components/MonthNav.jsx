import { Icon } from "./Icon.jsx";
import { monthName } from "../utils/helpers.js";

export const MonthNav = ({ viewMonth, viewYear, prevMonth, nextMonth, goToday, T, btnSecondary }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "16px 0" }}>
    <button onClick={prevMonth} style={{ ...btnSecondary, padding: "8px", borderRadius: "50%", display: "flex" }}><Icon name="left" size={18}/></button>
    <span style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, minWidth: 170, textAlign: "center" }}>{monthName(viewMonth, viewYear)}</span>
    <button onClick={nextMonth} style={{ ...btnSecondary, padding: "8px", borderRadius: "50%", display: "flex" }}><Icon name="right" size={18}/></button>
    <button onClick={goToday} style={{ ...btnSecondary, padding: "8px 16px", fontSize: 13, fontWeight: 700 }}>Heute</button>
  </div>
);
