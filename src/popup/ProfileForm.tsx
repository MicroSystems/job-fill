import React from "react";
import type { Profile } from "../types";
import { getProfile, saveProfile, getResume, storeResume, deleteResume } from "../storage";

function emptyProfile(): Profile {
  return {
    name: { given: "", family: "", middle: "" },
    email: "",
    phone: { national: "", countryCode: "1" },
    address: { line1: "", line2: "", city: "", state: "", zip: "", country: "" },
    social: { linkedin: "", portfolio: "", github: "" },
    experience: [{ company: "", title: "", start: "", end: "", current: false, description: "" }],
    education: [{ school: "", degree: "", field: "", graduation: "", gpa: "" }],
    skills: [],
    resume: null,
    coverLetter: "",
    answers: {},
  };
}

export function ProfileForm() {
  const [profile, setProfile] = React.useState<Profile>(emptyProfile);
  const [saved, setSaved] = React.useState(false);
  const [resumeFilename, setResumeFilename] = React.useState("");
  const [skillsText, setSkillsText] = React.useState("");

  React.useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setProfile(p);
        setSkillsText(Array.isArray(p.skills) ? p.skills.join(", ") : "");
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
          <label>
            LinkedIn
            <input value={profile.social.linkedin ?? ""} onChange={(e) => update("social.linkedin", e.target.value)} />
          </label>
          <label>
            Portfolio
            <input value={profile.social.portfolio ?? ""} onChange={(e) => update("social.portfolio", e.target.value)} />
          </label>
          <label>
            GitHub
            <input value={profile.social.github ?? ""} onChange={(e) => update("social.github", e.target.value)} />
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
          <div className="resume-info">
            <span>{resumeFilename}</span>
            <button className="btn btn-small" onClick={handleRemoveResume}>
              Remove
            </button>
          </div>
        ) : (
          <input type="file" accept=".pdf" onChange={handleResumeUpload} />
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

      <button className="btn btn-primary save-btn" onClick={handleSave}>
        {saved ? "Saved!" : "Save Profile"}
      </button>
    </div>
  );
}
