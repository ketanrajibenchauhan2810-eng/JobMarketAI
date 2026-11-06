import {
  ComposableMap,
  Geographies,
  Geography
} from "react-simple-maps";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import "./App.css";

const api = import.meta.env.VITE_API_URL || "http://localhost:5000";

const colors = [
  "#3478f6", "#8064ed", "#20b887", "#f59e0b",
  "#ef6685", "#18a6c9", "#8b9cf7", "#9b6bd3",
  "#e879f9", "#14b8a6"
];


const geoUrl =
  "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson";

const cityToState = {
  Ahmedabad: "Gujarat",
  Surat: "Gujarat",
  Rajkot: "Gujarat",
  Vadodara: "Gujarat",
  Bhavnagar: "Gujarat",
  Mumbai: "Maharashtra",
  Pune: "Maharashtra",
  Nagpur: "Maharashtra",
  Nashik: "Maharashtra",
  Delhi: "Delhi",
  Bengaluru: "Karnataka",
  Bangalore: "Karnataka",
  Chennai: "Tamil Nadu",
  Hyderabad: "Telangana",
  Kolkata: "West Bengal",
  Jaipur: "Rajasthan",
  Jodhpur: "Rajasthan",
  Lucknow: "Uttar Pradesh",
  Noida: "Uttar Pradesh",
  Gurugram: "Haryana",
  Gurgaon: "Haryana",
  Chandigarh: "Chandigarh",
  Bhopal: "Madhya Pradesh",
  Indore: "Madhya Pradesh",
  Patna: "Bihar",
  Ranchi: "Jharkhand",
  Raipur: "Chhattisgarh",
  Kochi: "Kerala",
  Thiruvananthapuram: "Kerala",
  Bhubaneswar: "Odisha",
  Guwahati: "Assam",
  Dehradun: "Uttarakhand",
  Shimla: "Himachal Pradesh",
  Jammu: "Jammu and Kashmir",
  Srinagar: "Jammu and Kashmir",
  Amritsar: "Punjab"
};

function getStateName(feature) {
  const p = feature.properties || {};

  return (
    p.NAME_1 ||
    p.st_nm ||
    p.name ||
    p.NAME ||
    p.ST_NM ||
    ""
  ).trim();
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
}

function shortMoney(value) {
  const number = Number(value || 0);

  if (number >= 10000000) {
    return `₹${(number / 10000000).toFixed(1)}Cr`;
  }

  if (number >= 100000) {
    return `₹${(number / 100000).toFixed(1)}L`;
  }

  return money(number);
}

function getSalary(job) {
  function convertSalary(value) {
    return Number(
      String(value || "").replace(/[₹,\s]/g, "")
    ) || 0;
  }

  const average = convertSalary(job.Average_Salary_INR_Year);
  const annual = convertSalary(job.Annual_Salary_INR);
  const max = convertSalary(job.Max_Salary_INR_Year);
  const min = convertSalary(job.Min_Salary_INR_Year);

  if (average > 0) return average;
  if (annual > 0) return annual;
  if (max > 0 && min > 0) return (min + max) / 2;
  if (max > 0) return max;
  if (min > 0) return min;

  return 0;
}

function App() {
  const [page, setPage] = useState("Dashboard");
  const [selectedState, setSelectedState] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredState, setHoveredState] = useState("");

  // Advanced Job Search States
  const [search, setSearch] = useState("");
  const [jobSkill, setJobSkill] = useState("");
  const [location, setLocation] = useState("All");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  // Skill Analysis State
  const [skillLimit, setSkillLimit] = useState("10");

  // Dashboard Chart States
  const [locationLimit, setLocationLimit] = useState("5");
  const [companyLimit, setCompanyLimit] = useState("5");
  const [roleLimit, setRoleLimit] = useState("5");
  const [salaryLocation, setSalaryLocation] = useState("All");

  // Salary Prediction States
  const [form, setForm] = useState({
    Job_Title: "Data Scientist",
    Location: "Ahmedabad",
    Experience_Years: 2,
    Skills: "Python, SQL, Machine Learning"
  });

  const stateJobData = useMemo(() => {
  const counts = {};

  jobs.forEach(job => {
    const city = String(job.Location || "").trim();
    const state = cityToState[city];

    if (state) {
      counts[state] = (counts[state] || 0) + 1;
    }
  });

  return counts;
}, [jobs]);


const stateColors = [
  "#4F80F5",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#A855F7",
  "#E879F9",
  "#0EA5E9",
  "#84CC16",
  "#D946EF",
  "#EF4444",
  "#0D9488",
  "#7C3AED",
  "#2563EB",
  "#CA8A04",
  "#DB2777",
  "#0891B2",
  "#65A30D",
  "#9333EA",
  "#EA580C",
  "#0284C7",
  "#C026D3",
  "#16A34A",
  "#E11D48",
  "#4D7C0F",
  "#7E22CE",
  "#B45309",
  "#0F766E",
  "#4338CA",
  "#BE185D",
  "#0369A1",
  "#A16207"
];

function getStateColor(stateName) {
  let total = 0;

  for (let i = 0; i < stateName.length; i++) {
    total += stateName.charCodeAt(i);
  }

  return stateColors[total % stateColors.length];
}

const selectedStateJobs = useMemo(() => {
  if (!selectedState) return [];

  return jobs.filter(job => {
    const city = String(job.Location || "").trim();
    return cityToState[city] === selectedState;
  });
}, [jobs, selectedState]);

  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState("");

  // Fetch Google Sheets Data
  useEffect(() => {
    fetch(`${api}/api/jobs`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Backend api error");
        }
        return response.json();
      })
      .then(result => {
        if (!result.success) {
          throw new Error(result.message || "Data error");
        }
        setJobs(result.jobs || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Location List
  const locations = useMemo(() => [
    "All",
    ...new Set(
      jobs
        .map(job => String(job.Location || "").trim())
        .filter(Boolean)
    )
  ], [jobs]);

  // Total Companies
  const companies = useMemo(() =>
    new Set(
      jobs
        .map(job => String(job.Company || "").trim())
        .filter(Boolean)
    ).size
  , [jobs]);

  // Salary Values
  const salaryValues = useMemo(() =>
    jobs
      .map(getSalary)
      .filter(value => value > 0 && Number.isFinite(value))
  , [jobs]);

  const averageSalary = salaryValues.length
    ? salaryValues.reduce((sum, value) => sum + value, 0) /
      salaryValues.length
    : 0;

  // Advanced Job Search Filter
  const filteredJobs = useMemo(() => {
    let result = jobs.filter(job => {
      const content = [
        job.Job_Title,
        job.Company,
        job.Location,
        job.Required_Skills,
        job.Skills
      ].join(" ").toLowerCase();

      const salary = getSalary(job);
      const experience = Number(job.Experience_Years);

      const matchesSearch =
        content.includes(search.trim().toLowerCase());

      const matchesLocation =
        location === "All" ||
        String(job.Location || "").trim() === location;

      const matchesSkill =
        !jobSkill ||
        content.includes(jobSkill.trim().toLowerCase());

      const matchesMinSalary =
        !minSalary || salary >= Number(minSalary);

      const matchesMaxSalary =
        !maxSalary || salary <= Number(maxSalary);

      const matchesMinExperience =
        !minExperience ||
        experience >= Number(minExperience);

      const matchesMaxExperience =
        !maxExperience ||
        experience <= Number(maxExperience);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesSkill &&
        matchesMinSalary &&
        matchesMaxSalary &&
        matchesMinExperience &&
        matchesMaxExperience
      );
    });

    if (sortBy === "salaryHigh") {
      result.sort((a, b) => getSalary(b) - getSalary(a));
    } else if (sortBy === "salaryLow") {
      result.sort((a, b) => getSalary(a) - getSalary(b));
    } else if (sortBy === "experience") {
      result.sort(
        (a, b) =>
          Number(a.Experience_Years || 0) -
          Number(b.Experience_Years || 0)
      );
    }

    return result;
  }, [
    jobs,
    search,
    jobSkill,
    location,
    minSalary,
    maxSalary,
    minExperience,
    maxExperience,
    sortBy
  ]);

  // Count Jobs by Column
  function makeCounts(column, limit) {
    const counts = {};

    jobs.forEach(job => {
      const value = String(job[column] || "").trim();

      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, Number(limit));
  }

  const locationData = useMemo(
    () => makeCounts("Location", locationLimit),
    [jobs, locationLimit]
  );

  const companyData = useMemo(
    () => makeCounts("Company", companyLimit),
    [jobs, companyLimit]
  );

  const roleData = useMemo(
    () => makeCounts("Job_Title", roleLimit),
    [jobs, roleLimit]
  );

  // Most Demanded Skills
  const skillData = useMemo(() => {
    const counts = {};

    jobs.forEach(job => {
      const rawSkills =
        job.Required_Skills ||
        job.Skills ||
        "";

      String(rawSkills)
        .split(/[,;|]/)
        .map(skill => skill.trim())
        .filter(Boolean)
        .forEach(skill => {
          const key = skill.toLowerCase();

          if (!counts[key]) {
            counts[key] = {
              name: skill,
              count: 0
            };
          }

          counts[key].count++;
        });
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, Number(skillLimit));
  }, [jobs, skillLimit]);

  // Salary by Experience
  const salaryData = useMemo(() => {
    const grouped = {};

    jobs.forEach(job => {
      if (
        salaryLocation !== "All" &&
        job.Location !== salaryLocation
      ) {
        return;
      }

      const salary = getSalary(job);

      if (!salary || !Number.isFinite(salary)) {
        return;
      }

      const experience = Number(job.Experience_Years);

      if (!Number.isFinite(experience)) {
        return;
      }

      const start = Math.floor(experience / 2) * 2;
      const group = `${start}-${start + 1}`;

      if (!grouped[group]) {
        grouped[group] = {
          experience: group,
          total: 0,
          count: 0
        };
      }

      grouped[group].total += salary;
      grouped[group].count++;
    });

    return Object.values(grouped)
      .map(item => ({
        experience: item.experience,
        averageSalary: Math.round(
          item.total / item.count
        ),
        jobs: item.count
      }))
      .sort((a, b) =>
        Number(a.experience.split("-")[0]) -
        Number(b.experience.split("-")[0])
      );
  }, [jobs, salaryLocation]);

  // Reset Search Filters
  function resetFilters() {
    setSearch("");
    setJobSkill("");
    setLocation("All");
    setMinSalary("");
    setMaxSalary("");
    setMinExperience("");
    setMaxExperience("");
    setSortBy("latest");
  }

  // Salary Prediction
  async function predictSalary(event) {
    event.preventDefault();

    setPredicting(true);
    setPrediction(null);
    setPredictError("");

    try {
      const response = await fetch(`${api}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          Experience_Years: Number(form.Experience_Years)
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Prediction failed"
        );
      }

      setPrediction(result.predictedSalary);
    } catch (err) {
      setPredictError(err.message);
    } finally {
      setPredicting(false);
    }
  }

  function updateForm(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  const menu = [
    { name: "Dashboard", icon: "▦" },
    { name: "Job Analysis", icon: "▥" },
    { name: "Find Jobs", icon: "⌕" },
    { name: "Skill Analysis", icon: "✧" },
    { name: "Salary Prediction", icon: "✦" }
  ];

  return (
    <div className="app-shell">

      {/* Sidebar */}
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setPage("Dashboard")}
        >
          <span className="brand-logo">AI</span>
          <span>
            JobMarket<span className="brand-accent">AI</span>
          </span>
        </button>

        <p className="menu-label">WORKSPACE</p>

        <nav className="side-menu">
          {menu.map(item => (
            <button
              key={item.name}
              onClick={() => setPage(item.name)}
              className={`side-link ${
                page === item.name ? "selected" : ""
              }`}
            >
              <span className="side-icon">{item.icon}</span>
              <span>{item.name}</span>
              {page === item.name && (
                <span className="active-dot" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="ai-card">
            <span className="ai-card-icon">✦</span>
            <strong>AI Insights</strong>
            <p>
              Explore job market trends and salary estimates.
            </p>
            <button onClick={() => setPage("Salary Prediction")}>
              Try Prediction →
            </button>
          </div>

          <p className="sidebar-foot">
            JOBMARKET AI · STUDENT PROJECT
          </p>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">

        <header className="topbar">
          <div>
            <p className="breadcrumb">
              Workspace / {page}
            </p>
            <h1>{page}</h1>
          </div>

          <div className="top-status">
            <span className="status-dot" />
            Google Sheets Data
          </div>
        </header>

        <main className="page-content">

          <div className="welcome-row">
            <div>
              <h2>
                {page === "Dashboard"
                  ? "Welcome to your dashboard"
                  : page}
              </h2>
              <p>
                Job market intelligence powered by live data and
                machine learning.
              </p>
            </div>

            <div className="date-chip">LIVE DATA</div>
          </div>

          {loading && (
            <div className="notice">
              Loading job data...
            </div>
          )}

          {error && !loading && (
            <div className="notice error">
              {error}. Ensure the backend is running on port 5000.
            </div>
          )}

          {/* Dashboard */}
          {page === "Dashboard" && !loading && !error && (
            <>
              
<div className="panel india-map-panel">
  <div className="chart-heading">
    <div>
      <h3>🇮🇳 India Job Market Explorer</h3>
      <p className="muted">
        Explore job opportunities across Indian states
      </p>
    </div>

    <span className="map-total">
      {Object.values(stateJobData).reduce(
        (sum, count) => sum + count,
        0
      )} Jobs Mapped
    </span>
  </div>

  <div className="india-map-layout">
    <div className="india-map">
      <ComposableMap
  projection="geoMercator"
  projectionConfig={{ center: [82, 23], scale: 850 }}
  width={600}
  height={500}
  style={{
    width: "100%",
    height: "100%",
    maxHeight: "480px",
    display: "block",
    margin: "auto"
  }}
>
        <Geographies geography={geoUrl}>
          
{({ geographies }) =>
  geographies.map((geo,index) => {
    const stateName = getStateName(geo);
    
    if (index === 0) {
    console.log("GeoJSON Properties:", geo.properties);
    console.log("State Name:", stateName);
   }

    const count = stateJobData[stateName] || 0;
    const active = selectedState === stateName;
    const hovering = hoveredState === stateName;

    return (
      <Geography
  key={geo.rsmKey}
  geography={geo}
  fill={getStateColor(stateName)}
  stroke="#ffffff"
  strokeWidth={1.5}
  onMouseEnter={() => setHoveredState(stateName)}
  onMouseLeave={() => setHoveredState("")}
  onClick={() => {
    setSelectedState(active ? "" : stateName);
  }}
  style={{
    default: {
      outline: "none"
    },
    hover: {
      fill: "#FFD43B",
      outline: "none"
    },
    pressed: {
      fill: "#2563EB",
      outline: "none"
    }
  }}
/>
    );
  })
}

        </Geographies>
      </ComposableMap>
    </div>

    
<div className="state-details">
  <div className="state-detail-heading">
    <span>INDIA STATE INSIGHTS</span>
    <button
      className="clear-state"
      onClick={() => {
        setSelectedState("");
        setHoveredState("");
      }}
    >
      Clear
    </button>
  </div>

  {(() => {
    const activeState = hoveredState || selectedState;

    const stateJobs = activeState
      ? jobs.filter(job =>
          cityToState[String(job.Location || "").trim()] === activeState
        )
      : [];

const validSalaries = stateJobs
  .map(getSalary)
  .filter(salary => salary > 0);

const avgSalary = validSalaries.length
  ? validSalaries.reduce((sum, salary) => sum + salary, 0) / validSalaries.length
  : 0;

    const companies = [...new Set(stateJobs.map(job => job.Company).filter(Boolean))];

    return activeState ? (
      <>
        <h2>{activeState}</h2>
        <div className="state-job-count">{stateJobs.length}</div>
        <p className="muted">Available Job Listings</p>

        <div className="state-mini-stats">
          <div>
            <span>Average Salary</span>
            <strong>₹{Math.round(avgSalary).toLocaleString("en-IN")}</strong>
          </div>
          <div>
            <span>Companies</span>
            <strong>{companies.length}</strong>
          </div>
        </div>

        <h4>Recent Job Details</h4>

        {stateJobs.slice(0, 5).map((job, index) => (
          <div className="state-job-card" key={job.Job_ID || index}>
            <strong>{job.Job_Title || job.JobTitle || "Job Role"}</strong>
            <p>{job.Company} · {job.Location}</p>
            <span>Experience: {job.Experience_Years ?? "N/A"} Years</span>
            <b>₹{getSalary(job).toLocaleString("en-IN")}</b>
          </div>
        ))}

        <button
          className="primary-btn state-view-btn"
          onClick={() => {
            setSelectedState(activeState);
            setPage("Find Jobs");
          }}
        >
          Explore State Jobs →
        </button>
      </>
    ) : (
      <>
        <div className="state-empty-icon">⌖</div>
        <h3>Explore Indian Job Market</h3>
        <p className="muted">
          Move your cursor over any state to view job listings,
          companies and salary details.
        </p>
      </>
    );
  })()}
</div>


  {selectedState && (
    <div className="state-jobs-preview">
      <h3>{selectedState} Job Listings</h3>
      <p className="muted">
        {selectedStateJobs.length} matching records found.
      </p>
      <JobTable
        jobs={selectedStateJobs.slice(0, 5)}
        title="Jobs in Selected State"
      />
    </div>
  )}
</div>
</div>

              <section className="stats-grid">
                <Stat
                  icon="▤"
                  label="Total Jobs"
                  value={jobs.length.toLocaleString("en-IN")}
                />
                <Stat
                  icon="▥"
                  label="Companies"
                  value={companies.toLocaleString("en-IN")}
                />
                <Stat
                  icon="⌖"
                  label="Locations"
                  value={locations.length - 1}
                />
                <Stat
                  icon="₹"
                  label="Average Salary"
                  value={money(averageSalary)}
                />
              </section>

              <section className="chart-grid">

                <div className="panel interactive-panel">
                  <div className="chart-heading">
                    <div>
                      <h3>Top Hiring Locations</h3>
                      <p className="muted">
                        Job listings by location
                      </p>
                    </div>

                    <select
                      value={locationLimit}
                      onChange={e =>
                        setLocationLimit(e.target.value)
                      }
                    >
                      <option value="5">Top 5</option>
                      <option value="8">Top 8</option>
                      <option value="10">Top 10</option>
                    </select>
                  </div>

                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={locationData}
                        margin={{
                          top: 15,
                          right: 15,
                          left: 0,
                          bottom: 35
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          angle={-20}
                          textAnchor="end"
                          interval={0}
                          height={65}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="count"
                          name="Job Listings"
                          fill="#3478f6"
                          radius={[7, 7, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel interactive-panel">
                  <div className="chart-heading">
                    <div>
                      <h3>Company Job Distribution</h3>
                      <p className="muted">
                        Job listings by company
                      </p>
                    </div>

                    <select
                      value={companyLimit}
                      onChange={e =>
                        setCompanyLimit(e.target.value)
                      }
                    >
                      <option value="5">Top 5</option>
                      <option value="8">Top 8</option>
                      <option value="10">Top 10</option>
                    </select>
                  </div>

                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={companyData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="48%"
                          outerRadius="75%"
                          innerRadius="42%"
                          paddingAngle={3}
                        >
                          {companyData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={colors[index % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={35}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel interactive-panel">
                  <div className="chart-heading">
                    <div>
                      <h3>Salary by Experience</h3>
                      <p className="muted">
                        Average annual salary by experience range
                      </p>
                    </div>

                    <select
                      value={salaryLocation}
                      onChange={e =>
                        setSalaryLocation(e.target.value)
                      }
                    >
                      {locations.map(loc => (
                        <option key={loc} value={loc}>
                          {loc === "All" ? "All Locations" : loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salaryData}
                        margin={{
                          top: 15,
                          right: 20,
                          left: 15,
                          bottom: 10
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="experience"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          tickFormatter={shortMoney}
                          tick={{ fontSize: 10 }}
                          width={75}
                        />
                        <Tooltip
                          content={<ChartTooltip salary />}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="averageSalary"
                          name="Average Salary"
                          stroke="#8064ed"
                          strokeWidth={3}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel interactive-panel">
                  <div className="chart-heading">
                    <div>
                      <h3>Most Listed Job Roles</h3>
                      <p className="muted">
                        Demand by job title
                      </p>
                    </div>

                    <select
                      value={roleLimit}
                      onChange={e =>
                        setRoleLimit(e.target.value)
                      }
                    >
                      <option value="5">Top 5</option>
                      <option value="8">Top 8</option>
                      <option value="10">Top 10</option>
                    </select>
                  </div>

                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={roleData}
                        layout="vertical"
                        margin={{
                          top: 10,
                          right: 20,
                          left: 20,
                          bottom: 10
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={130}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="count"
                          name="Job Listings"
                          fill="#8064ed"
                          radius={[0, 7, 7, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <JobTable
                jobs={jobs.slice(0, 8)}
                title="Recent Job Listings"
              />
            </>
          )}


{/* Job Analysis */}
{page === "Job Analysis" && !loading && !error && (
  <div className="analysis-page">

    {/* Analysis Welcome Banner */}
    <section className="analysis-banner">
      <div>
        <span className="analysis-eyebrow">AI POWERED ANALYTICS</span>
        <h2>Explore the Job Market</h2>
        <p>
          Understand hiring trends, company demand and salary patterns
          using your live job market dataset.
        </p>
      </div>
      <div className="analysis-banner-icon">📊</div>
    </section>

    {/* Statistics */}
    <section className="stats-grid analysis-stats">
      <Stat
        icon="▤"
        label="Total Job Records"
        value={jobs.length.toLocaleString("en-IN")}
      />
      <Stat
        icon="▥"
        label="Companies Hiring"
        value={companies.toLocaleString("en-IN")}
      />
      <Stat
        icon="⌖"
        label="Active Locations"
        value={(locations.length - 1).toLocaleString("en-IN")}
      />
      <Stat
        icon="₹"
        label="Average Annual Salary"
        value={money(averageSalary)}
      />
    </section>

    {/* Quick Insights */}
    <section className="analysis-insights">
      <div className="analysis-insight-card">
        <span className="insight-icon">💼</span>
        <div>
          <p>Most Hiring Location</p>
          <h3>{locationData[0]?.name || "N/A"}</h3>
          <small>{locationData[0]?.count || 0} job listings</small>
        </div>
      </div>

      <div className="analysis-insight-card">
        <span className="insight-icon">🏢</span>
        <div>
          <p>Top Hiring Company</p>
          <h3>{companyData[0]?.name || "N/A"}</h3>
          <small>{companyData[0]?.count || 0} job listings</small>
        </div>
      </div>

      <div className="analysis-insight-card">
        <span className="insight-icon">🚀</span>
        <div>
          <p>Most Listed Job Role</p>
          <h3>{roleData[0]?.name || "N/A"}</h3>
          <small>{roleData[0]?.count || 0} job listings</small>
        </div>
      </div>
    </section>

    {/* Charts */}
    <section className="chart-grid analysis-chart-grid">

      {/* Hiring Locations */}
      <div className="panel interactive-panel analysis-chart-card">
        <div className="chart-heading">
          <div>
            <h3>📍 Top Hiring Locations</h3>
            <p className="muted">Jobs available in different cities</p>
          </div>
          <select
            value={locationLimit}
            onChange={e => setLocationLimit(e.target.value)}
          >
            <option value="5">Top 5</option>
            <option value="8">Top 8</option>
            <option value="10">Top 10</option>
          </select>
        </div>

        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={locationData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                name="Job Listings"
                fill="#4f46e5"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Company Distribution */}
      <div className="panel interactive-panel analysis-chart-card">
        <div className="chart-heading">
          <div>
            <h3>🏢 Company Distribution</h3>
            <p className="muted">Hiring share of top companies</p>
          </div>
          <select
            value={companyLimit}
            onChange={e => setCompanyLimit(e.target.value)}
          >
            <option value="5">Top 5</option>
            <option value="8">Top 8</option>
            <option value="10">Top 10</option>
          </select>
        </div>

        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={companyData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius="70%"
                innerRadius="40%"
                paddingAngle={3}
              >
                {companyData.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="bottom" height={35} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Salary Overview */}
      <div className="panel interactive-panel analysis-chart-card">
        <div className="chart-heading">
          <div>
            <h3>💰 Salary by Experience</h3>
            <p className="muted">Average salary for experience levels</p>
          </div>
          <select
            value={salaryLocation}
            onChange={e => setSalaryLocation(e.target.value)}
          >
            {locations.map(loc => (
              <option key={loc} value={loc}>
                {loc === "All" ? "All Locations" : loc}
              </option>
            ))}
          </select>
        </div>

        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="experience" />
              <YAxis tickFormatter={shortMoney} width={75} />
              <Tooltip content={<ChartTooltip salary />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageSalary"
                name="Average Salary"
                stroke="#8b5cf6"
                strokeWidth={3}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Job Role Demand */}
      <div className="panel interactive-panel analysis-chart-card">
        <div className="chart-heading">
          <div>
            <h3>🚀 Most Listed Job Roles</h3>
            <p className="muted">Demand for different job positions</p>
          </div>
          <select
            value={roleLimit}
            onChange={e => setRoleLimit(e.target.value)}
          >
            <option value="5">Top 5</option>
            <option value="8">Top 8</option>
            <option value="10">Top 10</option>
          </select>
        </div>

        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={125}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                name="Job Listings"
                fill="#0ea5e9"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>

    {/* Salary Data Summary */}
    <section className="analysis-summary">
      <div>
        <span>📈</span>
        <div>
          <h3>Salary Data Overview</h3>
          <p>
            {salaryValues.length} job records contain usable salary data.
            Average annual salary is {money(averageSalary)}.
          </p>
        </div>
      </div>
      <div className="summary-badge">LIVE DATA</div>
    </section>

    {/* Recent Jobs */}
    <JobTable
      jobs={jobs.slice(0, 8)}
      title="📋 Recent Job Listings"
    />

  </div>
)}


          {/* Advanced Job Search */}
          {page === "Find Jobs" && !loading && !error && (
            <div className="panel find-jobs-panel">
              <div className="find-jobs-heading">
                <div>
                              <span className="find-jobs-tag">CAREER EXPLORER</span>
                                      <h2>Find Your Dream Job</h2>
                            <p>Discover opportunities that match your skills, salary and experience.</p>
                  </div>
                  <div className="find-jobs-icon">💼</div>
                  </div>
              <div className="advanced-filters">

                <label>
                  Search Job
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Job title, company or keyword"
                  />
                </label>

                <label>
                  Location
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>
                        {loc === "All" ? "All Locations" : loc}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Skills
                  <input
                    value={jobSkill}
                    onChange={e => setJobSkill(e.target.value)}
                    placeholder="Python, SQL, React..."
                  />
                </label>

                <label>
                  Minimum Salary (₹ / year)
                  <input
                    type="number"
                    min="0"
                    value={minSalary}
                    onChange={e => setMinSalary(e.target.value)}
                    placeholder="Example: 300000"
                  />
                </label>

                <label>
                  Maximum Salary (₹ / year)
                  <input
                    type="number"
                    min="0"
                    value={maxSalary}
                    onChange={e => setMaxSalary(e.target.value)}
                    placeholder="Example: 1500000"
                  />
                </label>

                <label>
                  Minimum Experience (Years)
                  <input
                    type="number"
                    min="0"
                    value={minExperience}
                    onChange={e => setMinExperience(e.target.value)}
                    placeholder="Minimum years"
                  />
                </label>

                <label>
                  Maximum Experience (Years)
                  <input
                    type="number"
                    min="0"
                    value={maxExperience}
                    onChange={e => setMaxExperience(e.target.value)}
                    placeholder="Maximum years"
                  />
                </label>

                <label>
                  Sort Jobs By
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="latest">Default Order</option>
                    <option value="salaryHigh">Highest Salary</option>
                    <option value="salaryLow">Lowest Salary</option>
                    <option value="experience">Lowest Experience</option>
                  </select>
                </label>
              </div>

              <button
                className="reset-btn"
                onClick={resetFilters}
              >
                Reset All Filters
              </button>

              <div className="search-result-heading">
                <h3>Search Results</h3>
                <span>{filteredJobs.length} Jobs Found</span>
              </div>

              <JobTable
                jobs={filteredJobs.slice(0, 100)}
                title="Available Job Opportunities"
              />

              {filteredJobs.length > 100 && (
                <p className="muted">
                  Showing first 100 results. Refine your filters.
                </p>
              )}
            </div>
          )}

          {/* Skill Analysis */}
          {page === "Skill Analysis" && !loading && !error && (
            <>
              <section className="stats-grid">
                <Stat
                  icon="✧"
                  label="Skills Found"
                  value={skillData.length}
                />
                <Stat
                  icon="▤"
                  label="Total Job Records"
                  value={jobs.length}
                />
                <Stat
                  icon="★"
                  label="Most Demanded Skill"
                  value={skillData[0]?.name || "N/A"}
                />
                <Stat
                  icon="↗"
                  label="Top Skill Mentions"
                  value={skillData[0]?.count || 0}
                />
              </section>

              <section className="chart-grid">

                <div className="panel interactive-panel">
                  <div className="chart-heading">
                    <div>
                      <h3>Most Demanded Skills</h3>
                      <p className="muted">
                        Skills mentioned in job listings
                      </p>
                    </div>

                    <select
                      value={skillLimit}
                      onChange={e => setSkillLimit(e.target.value)}
                    >
                      <option value="5">Top 5</option>
                      <option value="10">Top 10</option>
                      <option value="15">Top 15</option>
                      <option value="20">Top 20</option>
                    </select>
                  </div>

                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={skillData}
                        layout="vertical"
                        margin={{
                          top: 10,
                          right: 20,
                          left: 20,
                          bottom: 10
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={125}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="count"
                          name="Skill Mentions"
                          fill="#3478f6"
                          radius={[0, 7, 7, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel interactive-panel">
                  <div className="chart-heading">
                    <div>
                      <h3>Skill Distribution</h3>
                      <p className="muted">
                        Share of the selected top skills
                      </p>
                    </div>
                  </div>

                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={skillData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius="70%"
                          innerRadius="38%"
                          paddingAngle={3}
                        >
                          {skillData.map((item, index) => (
                            <Cell
                              key={item.name}
                              fill={colors[index % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={40}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <div className="panel table-panel">
                <h3>Top Demanded Skills Details</h3>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Skill Name</th>
                        <th>Job Listings Mentioning Skill</th>
                      </tr>
                    </thead>

                    <tbody>
                      {skillData.map((skill, index) => (
                        <tr key={skill.name}>
                          <td>#{index + 1}</td>
                          <td>{skill.name}</td>
                          <td>{skill.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!skillData.length && (
                    <p className="muted">
                      No skill data found. Check the
                      Required_Skills or Skills column in Google Sheets.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Salary Prediction */}
          {page === "Salary Prediction" && (
            <section className="prediction-grid">
              <div className="panel">
                <h3>AI Salary Predictor</h3>
                <p className="muted">
                  Enter your job details to estimate annual salary.
                </p>

                <form
                  className="prediction-form"
                  onSubmit={predictSalary}
                >
                  <label>
                    Job Title
                    <input
                      name="Job_Title"
                      value={form.Job_Title}
                      onChange={updateForm}
                      required
                    />
                  </label>

                  <label>
                    Location
                    <input
                      name="Location"
                      value={form.Location}
                      onChange={updateForm}
                      required
                    />
                  </label>

                  <label>
                    Experience (Years)
                    <input
                      name="Experience_Years"
                      type="number"
                      min="0"
                      max="50"
                      value={form.Experience_Years}
                      onChange={updateForm}
                      required
                    />
                  </label>

                  <label>
                    Skills
                    <input
                      name="Skills"
                      value={form.Skills}
                      onChange={updateForm}
                      placeholder="Python, SQL, ML"
                    />
                  </label>

                  <button
                    className="primary-btn full-width"
                    disabled={predicting}
                  >
                    {predicting
                      ? "Predicting..."
                      : "✦ Predict Salary"}
                  </button>
                </form>

                {predictError && (
                  <p className="error-text">{predictError}</p>
                )}
              </div>

              <aside className="panel result-panel">
                <div className="result-symbol">₹</div>
                <p className="eyebrow">
                  MACHINE LEARNING ESTIMATE
                </p>
                <h3>Estimated Annual Salary</h3>

                {prediction !== null
                  ? (
                    <div className="prediction-value">
                      {money(prediction)}
                    </div>
                  )
                  : (
                    <div className="result-placeholder">
                      Your estimate will appear here.
                    </div>
                  )}

                <p className="muted">
                  An estimate from the available dataset,
                  not a guaranteed job offer.
                </p>
              </aside>
            </section>
          )}

        </main>

        <footer>
          JobMarketAI · React + Node.js + Python ML
        </footer>
      </div>
    </div>
  );
}

// Chart Tooltip
function ChartTooltip({ active, payload, label, salary }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="custom-chart-tooltip">
      <strong>
        {payload[0].payload.name ||
          label ||
          payload[0].name}
      </strong>

      {payload.map((item, index) => (
        <p key={index}>
          {item.name}:{" "}
          <b>
            {salary
              ? money(item.value)
              : Number(item.value).toLocaleString("en-IN")}
          </b>
        </p>
      ))}

      {payload[0].payload.jobs !== undefined && (
        <p>
          Jobs: <b>{payload[0].payload.jobs}</b>
        </p>
      )}
    </div>
  );
}

// Dashboard Stat Card
function Stat({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <p>{label}</p>
      <h2>{value}</h2>
    </div>
  );
}

// Job Table
function JobTable({ jobs, title }) {
  return (
    <section className="panel table-panel">
      <h3>{title}</h3>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Company</th>
              <th>Location</th>
              <th>Experience</th>
              <th>Annual Salary</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job, index) => (
              <tr
                key={
                  job.Job_ID ||
                  `${job.Job_Title}-${index}`
                }
              >
                <td>{job.Job_Title || "-"}</td>
                <td>{job.Company || "-"}</td>
                <td>{job.Location || "-"}</td>
                <td>
                  {job.Experience_Years ?? "-"} yrs
                </td>
                <td>{money(getSalary(job))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!jobs.length && (
          <p className="muted">No jobs found.</p>
        )}
      </div>
    </section>
  );
}

export default App;

