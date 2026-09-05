interface CalcKeypadProps {
  /** 按键回调：'0'-'9'、'.'、'+'、'-'、'*'、'/'、'del' */
  onKey: (k: string) => void;
}

/** 四则运算计算器键盘（余额调整 / 金额编辑共用） */
export function CalcKeypad({ onKey }: CalcKeypadProps) {
  const keys = ['1', '2', '3', '+', '4', '5', '6', '-', '7', '8', '9', '×', '.', '0', 'del', '÷'];
  return (
    <div className="kp-grid">
      {keys.map((k) => {
        if (k === 'del')
          return (
            <button key={k} type="button" className="kp-key op" onClick={() => onKey(k)} aria-label="退格">
              ⌫
            </button>
          );
        if ('+-×÷'.includes(k))
          return (
            <button key={k} type="button" className="kp-key op" onClick={() => onKey(k)}>
              {k}
            </button>
          );
        return (
          <button key={k} type="button" className="kp-key" onClick={() => onKey(k)}>
            {k}
          </button>
        );
      })}
    </div>
  );
}
