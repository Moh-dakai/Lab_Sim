const { useEffect, useMemo, useRef, useState } = React;
const API_URL = "https://lab-sim.onrender.com/";

const experiments = {
  ohms: {
    title: "Ohm's Law",
    description: "Explore how voltage and resistance affect electrical current.",
    endpoint: "/simulate/ohms",
    inputs: [
      { key: "voltage", label: "Voltage (V)", min: 1, max: 240, step: 1, defaultValue: 12 },
      { key: "resistance", label: "Resistance (ohm)", min: 1, max: 100, step: 1, defaultValue: 6 },
    ],
  },
  projectile: {
    title: "Projectile Motion",
    description: "See how launch angle and speed shape a projectile's path.",
    endpoint: "/simulate/projectile",
    inputs: [
      { key: "angle", label: "Angle (degrees)", min: 10, max: 80, step: 1, defaultValue: 45 },
      { key: "velocity", label: "Initial Velocity (m/s)", min: 5, max: 60, step: 1, defaultValue: 25 },
    ],
  },
  hooke: {
    title: "Hooke's Law",
    description: "Measure how much a spring stretches for a given force.",
    endpoint: "/simulate/hooke",
    inputs: [
      { key: "force", label: "Force (N)", min: 1, max: 100, step: 1, defaultValue: 20 },
      { key: "spring_constant", label: "Spring Constant (N/m)", min: 1, max: 50, step: 1, defaultValue: 10 },
    ],
  },
};

function App() {
  const [selectedExperiment, setSelectedExperiment] = useState("ohms");
  const [difficulty, setDifficulty] = useState("beginner");
  const [formValues, setFormValues] = useState(getDefaultValues("ohms"));
  const [simulationResult, setSimulationResult] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [error, setError] = useState("");

  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const experimentConfig = useMemo(() => experiments[selectedExperiment], [selectedExperiment]);

  useEffect(() => {
    const defaults = getDefaultValues(selectedExperiment);
    setFormValues(defaults);
    setSimulationResult(null);
    setExplanation("");
    setError("");
  }, [selectedExperiment]);

  useEffect(() => {
    if (!simulationResult) {
      destroyChart(chartInstanceRef);
      return;
    }

    if (selectedExperiment === "projectile") {
      const points = simulationResult.results.trajectory;
      renderLineChart(chartCanvasRef.current, chartInstanceRef, {
        label: "Trajectory",
        labels: points.map((point) => point.x),
        data: points.map((point) => point.y),
        xLabel: "Horizontal Distance (m)",
        yLabel: "Height (m)",
        color: "#f28f3b",
      });
    } else if (selectedExperiment === "hooke") {
      const points = simulationResult.results.graph;
      renderLineChart(chartCanvasRef.current, chartInstanceRef, {
        label: "Extension",
        labels: points.map((point) => point.force),
        data: points.map((point) => point.extension),
        xLabel: "Force (N)",
        yLabel: "Extension (m)",
        color: "#2a7f62",
      });
    } else {
      destroyChart(chartInstanceRef);
    }
  }, [simulationResult, selectedExperiment]);

  async function runSimulation() {
    setLoadingSimulation(true);
    setError("");
    setExplanation("");

    try {
      const response = await fetch(`${API_URL}${experimentConfig.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Simulation failed.");
      }
      setSimulationResult(data);
    } catch (err) {
      setSimulationResult(null);
      setError(err.message);
    } finally {
      setLoadingSimulation(false);
    }
  }

  async function requestExplanation() {
    if (!simulationResult) {
      setError("Run the simulation before requesting an explanation.");
      return;
    }

    setLoadingExplanation(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experiment: simulationResult.experiment,
          inputs: simulationResult.inputs,
          results: simulationResult.results,
          difficulty,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Explanation failed.");
      }

      const formatted =
        data.raw_text ||
        `What happened: ${data.explanation}\n\nWhy it happened: ${data.why_it_happened}\n\nReal-world example: ${data.real_world_example}`;
      setExplanation(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingExplanation(false);
    }
  }

  function resetExperiment() {
    setFormValues(getDefaultValues(selectedExperiment));
    setSimulationResult(null);
    setExplanation("");
    setError("");
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Hackathon MVP</p>
          <h1>AI Lab Simulator</h1>
          <p className="hero-copy">
            Run virtual physics experiments, visualize the results, and ask AI to explain what
            happened in plain language.
          </p>
        </div>
      </header>

      <main className="dashboard">
        <section className="panel selector-panel">
          <h2>1. Choose an Experiment</h2>
          <div className="experiment-grid">
            {Object.entries(experiments).map(([key, experiment]) => (
              <button
                key={key}
                className={`experiment-card ${selectedExperiment === key ? "active" : ""}`}
                onClick={() => setSelectedExperiment(key)}
              >
                <span>{experiment.title}</span>
                <small>{experiment.description}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="workspace">
          <div className="panel controls-panel">
            <h2>2. Adjust Inputs</h2>
            {experimentConfig.inputs.map((input) => (
              <label className="input-group" key={input.key}>
                <div className="input-row">
                  <span>{input.label}</span>
                  <strong>{formValues[input.key]}</strong>
                </div>
                <input
                  type="range"
                  min={input.min}
                  max={input.max}
                  step={input.step}
                  value={formValues[input.key]}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      [input.key]: Number(event.target.value),
                    }))
                  }
                />
              </label>
            ))}

            <label className="input-group">
              <div className="input-row">
                <span>Explanation Level</span>
              </div>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <div className="button-row">
              <button className="primary-button" onClick={runSimulation} disabled={loadingSimulation}>
                {loadingSimulation ? "Simulating..." : "Run Simulation"}
              </button>
              <button className="secondary-button" onClick={resetExperiment}>
                Reset
              </button>
            </div>
          </div>

          <div className="panel results-panel">
            <h2>3. Results</h2>
            {simulationResult ? (
              <>
                <ResultSummary result={simulationResult} selectedExperiment={selectedExperiment} />
                {(selectedExperiment === "projectile" || selectedExperiment === "hooke") && (
                  <div className="chart-wrap">
                    <canvas ref={chartCanvasRef}></canvas>
                  </div>
                )}
              </>
            ) : (
              <p className="placeholder">Run a simulation to see numbers and charts here.</p>
            )}
          </div>
        </section>

        <section className="panel explanation-panel">
          <div className="explanation-header">
            <div>
              <h2>4. AI Explanation</h2>
              <p>Ask for a beginner, intermediate, or advanced breakdown of the result.</p>
            </div>
            <button
              className="primary-button"
              onClick={requestExplanation}
              disabled={loadingExplanation || !simulationResult}
            >
              {loadingExplanation ? "Explaining..." : "Explain Result"}
            </button>
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          <pre className="explanation-box">
            {explanation || "Your explanation will appear here after the simulation runs."}
          </pre>
        </section>
      </main>
    </div>
  );
}

function ResultSummary({ result, selectedExperiment }) {
  if (selectedExperiment === "ohms") {
    return (
      <div className="result-card spotlight">
        <span>Current</span>
        <strong>{result.results.current} A</strong>
      </div>
    );
  }

  if (selectedExperiment === "projectile") {
    return (
      <div className="result-grid">
        <ResultCard label="Flight Time" value={`${result.results.flight_time} s`} />
        <ResultCard label="Maximum Height" value={`${result.results.max_height} m`} />
        <ResultCard label="Range" value={`${result.results.range} m`} />
      </div>
    );
  }

  return (
    <div className="result-grid">
      <ResultCard label="Extension" value={`${result.results.extension} m`} />
      <ResultCard label="Spring Constant" value={`${result.inputs.spring_constant} N/m`} />
    </div>
  );
}

function ResultCard({ label, value }) {
  return (
    <div className="result-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getDefaultValues(experimentKey) {
  return experiments[experimentKey].inputs.reduce((accumulator, input) => {
    accumulator[input.key] = input.defaultValue;
    return accumulator;
  }, {});
}

function destroyChart(chartInstanceRef) {
  if (chartInstanceRef.current) {
    chartInstanceRef.current.destroy();
    chartInstanceRef.current = null;
  }
}

function renderLineChart(canvas, chartInstanceRef, config) {
  if (!canvas) {
    return;
  }

  destroyChart(chartInstanceRef);

  chartInstanceRef.current = new Chart(canvas, {
    type: "line",
    data: {
      labels: config.labels,
      datasets: [
        {
          label: config.label,
          data: config.data,
          borderColor: config.color,
          backgroundColor: "rgba(255,255,255,0.08)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#f7f3e8" },
        },
      },
      scales: {
        x: {
          title: { display: true, text: config.xLabel, color: "#f7f3e8" },
          ticks: { color: "#f7f3e8" },
          grid: { color: "rgba(247,243,232,0.1)" },
        },
        y: {
          title: { display: true, text: config.yLabel, color: "#f7f3e8" },
          ticks: { color: "#f7f3e8" },
          grid: { color: "rgba(247,243,232,0.1)" },
        },
      },
    },
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
