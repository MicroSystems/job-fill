import React from "react";
import type { Profile } from "../types";
import { getProfile, saveProfile, getResume, storeResume, deleteResume } from "../storage";

function demoProfile(): Profile {
  return {
    name: { given: "John", family: "Doe", middle: "" },
    email: "john.doe@example.com",
    phone: { national: "555-123-4567", countryCode: "1" },
    address: { line1: "123 Main St", line2: "", city: "San Francisco", state: "CA", zip: "94105", country: "United States" },
    social: { linkedin: "https://linkedin.com/in/johndoe", portfolio: "", github: "https://github.com/johndoe" },
    experience: [{ company: "Acme Corp", title: "Software Engineer", start: "2020-01", end: "", current: true, description: "" }],
    education: [{ school: "State University", degree: "Bachelor's", field: "Computer Science", graduation: "2019-06", gpa: "" }],
    skills: ["JavaScript", "TypeScript", "React", "Python"],
    resume: null,
    coverLetter: "I am excited to apply for this position and believe my skills are a great match.",
    answers: {},
    desiredCompensation: "",
    workAuthorization: "",
    gender: "",
    race: "",
    veteranStatus: "",
    disabilityStatus: "",
  };
}

export function ProfileForm() {
  const [profile, setProfile] = React.useState<Profile>(demoProfile);
  const [saved, setSaved] = React.useState(false);
  const [resumeFilename, setResumeFilename] = React.useState("");
  const [skillsText, setSkillsText] = React.useState("");

  React.useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setProfile(p);
        setSkillsText(Array.isArray(p.skills) ? p.skills.join(", ") : "");
      } else {
        saveProfile(demoProfile());
        setSkillsText("JavaScript, TypeScript, React, Python");
      }
    });
    getResume().then((r) => {
      if (r) setResumeFilename(r.filename);
    });
  }, []);

  const update = (path: string, value: any) => {
    setProfile((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    const p = { ...profile, skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean) };
    await saveProfile(p);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const data = (reader.result as string).split(",")[1];
      await storeResume(file.name, data);
      setResumeFilename(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveResume = async () => {
    await deleteResume();
    setResumeFilename("");
  };

  const addExperience = () => {
    setProfile((prev) => ({
      ...prev,
      experience: [...prev.experience, { company: "", title: "", start: "", end: "", current: false, description: "" }],
    }));
  };

  const addEducation = () => {
    setProfile((prev) => ({
      ...prev,
      education: [...prev.education, { school: "", degree: "", field: "", graduation: "", gpa: "" }],
    }));
  };

  return (
    <div className="profile-form">
      <section>
        <h2>Contact</h2>
        <div className="field-row">
          <label>
            First Name
            <input value={profile.name.given} onChange={(e) => update("name.given", e.target.value)} />
          </label>
          <label>
            Middle Name
            <input value={profile.name.middle ?? ""} onChange={(e) => update("name.middle", e.target.value)} />
          </label>
          <label>
            Last Name
            <input value={profile.name.family} onChange={(e) => update("name.family", e.target.value)} />
          </label>
        </div>
        <div className="field-row">
          <label>
            Email
            <input type="email" value={profile.email} onChange={(e) => update("email", e.target.value)} />
          </label>
          <label>
            Phone
            <input value={profile.phone.national} onChange={(e) => update("phone.national", e.target.value)} />
          </label>
        </div>
      </section>

      <section>
        <h2>Address</h2>
        <div className="field-row">
          <label className="wide">
            Street
            <input value={profile.address.line1} onChange={(e) => update("address.line1", e.target.value)} />
          </label>
        </div>
        <div className="field-row">
          <label>
            City
            <input value={profile.address.city} onChange={(e) => update("address.city", e.target.value)} />
          </label>
          <label>
            State
            <input value={profile.address.state} onChange={(e) => update("address.state", e.target.value)} />
          </label>
          <label>
            ZIP
            <input value={profile.address.zip} onChange={(e) => update("address.zip", e.target.value)} />
          </label>
          <label>
            Country
            <input value={profile.address.country} onChange={(e) => update("address.country", e.target.value)} />
          </label>
        </div>
      </section>

      <section>
        <h2>Links</h2>
        <div className="field-row">
          <label className="wide">
            LinkedIn
            <input value={profile.social.linkedin ?? ""} onChange={(e) => update("social.linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
          </label>
        </div>
        <div className="field-row" style={{ marginTop: 6 }}>
          <label className="wide">
            Portfolio / Website
            <input value={profile.social.portfolio ?? ""} onChange={(e) => update("social.portfolio", e.target.value)} placeholder="https://..." />
          </label>
        </div>
        <div className="field-row" style={{ marginTop: 6 }}>
          <label className="wide">
            GitHub
            <input value={profile.social.github ?? ""} onChange={(e) => update("social.github", e.target.value)} placeholder="https://github.com/..." />
          </label>
        </div>
      </section>

      <section>
        <h2>Skills</h2>
        <textarea
          rows={3}
          placeholder="Comma-separated skills"
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
        />
      </section>

      <section>
        <h2>Resume</h2>
        {resumeFilename ? (
          <div className="resume-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{resumeFilename}</span>
            <button className="btn btn-small" onClick={handleRemoveResume}>
              Remove
            </button>
          </div>
        ) : (
          <p className="hint" style={{ textAlign: "left", padding: "4px 0" }}>
            <button
              className="btn btn-small"
              onClick={() => browser.runtime.sendMessage({ type: "open-resume-upload" })}
            >
              Upload Resume
            </button>
          </p>
        )}
      </section>

      <section>
        <h2>Cover Letter</h2>
        <textarea
          rows={4}
          value={profile.coverLetter}
          onChange={(e) => update("coverLetter", e.target.value)}
        />
      </section>

      <section>
        <h2>Compensation</h2>
        <div className="field-row">
          <label className="wide">
            Desired Compensation (e.g. "$120,000" or "Negotiable")
            <input
              value={profile.desiredCompensation ?? ""}
              onChange={(e) => update("desiredCompensation", e.target.value)}
              placeholder="e.g. $120,000"
            />
          </label>
        </div>
      </section>

      <section>
        <h2>Work History</h2>
        {profile.experience.map((exp, i) => (
          <div key={i} className="entry-block">
            <div className="field-row">
              <label>
                Company
                <input value={exp.company} onChange={(e) => update(`experience.${i}.company`, e.target.value)} />
              </label>
              <label>
                Title
                <input value={exp.title} onChange={(e) => update(`experience.${i}.title`, e.target.value)} />
              </label>
            </div>
            <div className="field-row">
              <label>
                Start
                <input type="month" value={exp.start} onChange={(e) => update(`experience.${i}.start`, e.target.value)} />
              </label>
              <label>
                End
                <input type="month" value={exp.end} disabled={exp.current} onChange={(e) => update(`experience.${i}.end`, e.target.value)} />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => update(`experience.${i}.current`, e.target.checked)}
                />
                Current
              </label>
            </div>
          </div>
        ))}
        <button className="btn btn-small" onClick={addExperience}>
          + Add Experience
        </button>
      </section>

      <section>
        <h2>Education</h2>
        {profile.education.map((edu, i) => (
          <div key={i} className="entry-block">
            <div className="field-row">
              <label>
                School
                <input value={edu.school} onChange={(e) => update(`education.${i}.school`, e.target.value)} />
              </label>
              <label>
                Degree
                <input value={edu.degree} onChange={(e) => update(`education.${i}.degree`, e.target.value)} />
              </label>
            </div>
            <div className="field-row">
              <label>
                Field of Study
                <input value={edu.field} onChange={(e) => update(`education.${i}.field`, e.target.value)} />
              </label>
              <label>
                Graduation
                <input type="month" value={edu.graduation} onChange={(e) => update(`education.${i}.graduation`, e.target.value)} />
              </label>
              <label>
                GPA
                <input value={edu.gpa ?? ""} onChange={(e) => update(`education.${i}.gpa`, e.target.value)} />
              </label>
            </div>
          </div>
        ))}
        <button className="btn btn-small" onClick={addEducation}>
          + Add Education
        </button>
      </section>

      <section>
        <h2>Work Authorization</h2>
        <div className="field-row">
          <label className="wide">
            Are you legally entitled to work in Canada?
            <select value={profile.workAuthorization ?? ""} onChange={(e) => update("workAuthorization", e.target.value)}>
              <option value="">--</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h2>Demographics (optional)</h2>
        <p className="hint" style={{ textAlign: "left", marginBottom: 8 }}>
          Used for EEO questions on job applications.
        </p>
        <div className="field-row">
          <label>
            Gender
            <select value={profile.gender ?? ""} onChange={(e) => update("gender", e.target.value)}>
              <option value="">--</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Choose not to Answer">Choose not to Answer</option>
            </select>
          </label>
          <label>
            Race / Ethnicity
            <select value={profile.race ?? ""} onChange={(e) => update("race", e.target.value)}>
              <option value="">--</option>
              <option value="White / Caucasian">White / Caucasian</option>
              <option value="Hispanic, Latino, or Spanish origin">Hispanic, Latino, or Spanish origin</option>
              <option value="Black or African American">Black or African American</option>
              <option value="Asian">Asian</option>
              <option value="Native Hawaiian or other Pacific Islander">Native Hawaiian or other Pacific Islander</option>
              <option value="Some other race, ethnicity, or origin">Some other race, ethnicity, or origin</option>
              <option value="Choose not to Answer">Choose not to Answer</option>
            </select>
          </label>
        </div>
        <div className="field-row">
          <label>
            Veteran Status
            <select value={profile.veteranStatus ?? ""} onChange={(e) => update("veteranStatus", e.target.value)}>
              <option value="">--</option>
              <option value="I identify as a veteran">I identify as a veteran</option>
              <option value="I am not a veteran">I am not a veteran</option>
              <option value="Choose not to Answer">Choose not to Answer</option>
            </select>
          </label>
          <label>
            Disability Status
            <select value={profile.disabilityStatus ?? ""} onChange={(e) => update("disabilityStatus", e.target.value)}>
              <option value="">--</option>
              <option value="I have a disability">I have a disability</option>
              <option value="I do not have a disability">I do not have a disability</option>
              <option value="Choose not to Answer">Choose not to Answer</option>
            </select>
          </label>
        </div>
      </section>

      <button className="btn btn-primary save-btn" onClick={handleSave}>
        {saved ? "Saved!" : "Save Profile"}
      </button>
    </div>
  );
}
