import React from "react";
import type { Profile } from "../types";
import { getProfile, saveProfile, getResume, storeResume, deleteResume, getCurrentProfileName } from "../storage";

export function ProfileForm({ profileName: initialName }: { profileName?: string }) {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [profileName, setProfileName] = React.useState(initialName ?? "");
  const [saved, setSaved] = React.useState(false);
  const [resumeFilename, setResumeFilename] = React.useState("");
  const [skillsText, setSkillsText] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const name = initialName || (await getCurrentProfileName());
      setProfileName(name);
      const p = await getProfile(name);
      if (p) {
        setProfile(p);
        setSkillsText(Array.isArray(p.skills) ? p.skills.join(", ") : "");
      }
      const r = await getResume(name);
      if (r) setResumeFilename(r.filename);
      setLoading(false);
    })();
  }, [initialName]);

  if (loading || !profile) return <div style={{ padding: 20, color: "var(--text-secondary)" }}>Loading...</div>;

  const update = (path: string, value: any) => {
    setProfile((prev) => {
      if (!prev) return prev;
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
    if (!profile) return;
    const p = { ...profile, skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean) };
    await saveProfile(p, profileName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const data = (reader.result as string).split(",")[1];
      await storeResume(file.name, data, profileName);
      setResumeFilename(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveResume = async () => {
    await deleteResume(profileName);
    setResumeFilename("");
  };

  const addExperience = () => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        experience: [...prev.experience, { company: "", title: "", start: "", end: "", current: false, description: "" }],
      };
    });
  };

  const addEducation = () => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        education: [...prev.education, { school: "", degree: "", field: "", graduation: "", gpa: "" }],
      };
    });
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
        <h2>Current Location</h2>
        <div className="field-row">
          <label className="wide">
            Where are you currently located?
            <input
              value={profile.currentLocation ?? ""}
              onChange={(e) => update("currentLocation", e.target.value)}
              placeholder="e.g. San Francisco, CA"
            />
          </label>
        </div>
      </section>

      <section>
        <h2>Pronouns</h2>
        <div className="field-row">
          <label className="wide">
            Your pronouns
            <input
              value={profile.pronouns ?? ""}
              onChange={(e) => update("pronouns", e.target.value)}
              placeholder="e.g. they/them/theirs"
            />
          </label>
        </div>
      </section>

      <section>
        <h2>Current Company</h2>
        <div className="field-row">
          <label className="wide">
            Your current or most recent employer
            <input
              value={profile.currentCompany ?? ""}
              onChange={(e) => update("currentCompany", e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </label>
        </div>
      </section>

      <section>
        <h2>Notice Period</h2>
        <div className="field-row">
          <label className="wide">
            What is your notice period?
            <input
              value={profile.noticePeriod ?? ""}
              onChange={(e) => update("noticePeriod", e.target.value)}
              placeholder="e.g. 2 weeks, 30 days, Immediate"
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
            Are you legally authorized to work in the country you are applying for?
            <select value={profile.workAuthorization ?? ""} onChange={(e) => update("workAuthorization", e.target.value)}>
              <option value="">--</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </label>
        </div>
        <div className="field-row" style={{ marginTop: 6 }}>
          <label className="wide">
            Will you now or in the future require sponsorship for employment visa status?
            <select value={profile.requiredVisaSponsorship !== undefined ? (profile.requiredVisaSponsorship ? "Yes" : "No") : ""} onChange={(e) => update("requiredVisaSponsorship", e.target.value === "Yes" ? true : e.target.value === "No" ? false : "")}>
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
          <label className="wide">
            Gender
            <select value={profile.gender ?? ""} onChange={(e) => update("gender", e.target.value)}>
              <option value="">--</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Choose not to Answer">Choose not to Answer</option>
            </select>
          </label>
        </div>
        <div className="field-row" style={{ marginTop: 6 }}>
          <label className="wide">
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
        <div className="field-row" style={{ marginTop: 6 }}>
          <label className="wide">
            Veteran Status
            <select value={profile.veteranStatus ?? ""} onChange={(e) => update("veteranStatus", e.target.value)}>
              <option value="">--</option>
              <option value="I identify as a veteran">I identify as a veteran</option>
              <option value="I am not a veteran">I am not a veteran</option>
              <option value="Choose not to Answer">Choose not to Answer</option>
            </select>
          </label>
        </div>
        <div className="field-row" style={{ marginTop: 6 }}>
          <label className="wide">
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
