import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { authService, type User } from "@/services/auth";
import { peopleService } from "@/services/people";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/lasdpc-logo.png";
import AffiliationInput from "@/components/profile/AffiliationInput";
import { uploadProfilePhoto } from "@/services/uploads";
import { mediaUrl } from "@/lib/media";

const ACADEMIC_LEVELS = [
  { value: "undergrad", level: "Undergraduate", levelPt: "Graduação" },
  { value: "masters", level: "MSc", levelPt: "Mestrado" },
  { value: "phd", level: "PhD", levelPt: "Doutorado" },
  { value: "other", level: "", levelPt: "" },
];

const RegisterPage = () => {
  const { lang, t } = useLang();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [role, setRole] = useState("aluno_ativo");
  const [advisorId, setAdvisorId] = useState("");
  const [academicLevel, setAcademicLevel] = useState("masters");
  const [customAcademicLevel, setCustomAcademicLevel] = useState("");
  const [lattes, setLattes] = useState("");
  const [orcid, setOrcid] = useState("");
  const [scholar, setScholar] = useState("");
  const [github, setGithub] = useState("");
  const [labRelationshipType, setLabRelationshipType] = useState("academic_advisor");
  const [affiliationName, setAffiliationName] = useState("");
  const [registrationObjective, setRegistrationObjective] = useState("");
  const [observation, setObservation] = useState("");
  const [uspNumber, setUspNumber] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const isStudent = role === "aluno_ativo" || role === "alumni";
  const isPt = lang === "pt-BR";
  const steps = [
    {
      title: isPt ? "Conta" : "Account",
      helper: isPt
        ? "Informe seus dados principais e escolha o tipo de vínculo com o laboratório."
        : "Enter your main details and choose your link to the lab.",
    },
    {
      title: isPt ? "Perfil" : "Profile",
      helper: isPt
        ? "Complete as informações acadêmicas necessárias para análise da solicitação."
        : "Complete the academic details needed to review your request.",
    },
    {
      title: isPt ? "Solicitação" : "Request",
      helper: isPt
        ? "Conte brevemente o objetivo do cadastro e confirme o aceite da política."
        : "Briefly describe the request objective and confirm the policy consent.",
    },
  ];
  const progressPercent = (currentStep / (steps.length - 1)) * 100;

  useEffect(() => {
    peopleService.listDocentes()
      .then(setAdvisors)
      .catch(() => setAdvisors([]));
  }, []);

  const handlePhotoUpload = async (file?: File) => {
    if (!file) return;
    setUploadingPhoto(true);
    setError("");
    try {
      const { key } = await uploadProfilePhoto(file, true);
      setPhoto(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const validateStep = (step: number) => {
    setError("");

    if (step === 0) {
      if (!name.trim() || !email.trim() || !password || !photo) {
        setError(isPt ? "Preencha nome, e-mail, senha e foto para continuar." : "Fill in name, email, password, and photo to continue.");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError(isPt ? "Informe um e-mail válido para continuar." : "Enter a valid email to continue.");
        return false;
      }
      if (password.length < 6) {
        setError(isPt ? "A senha deve ter pelo menos 6 caracteres." : "Password must be at least 6 characters.");
        return false;
      }
    }

    if (step === 1) {
      const selectedLevel = ACADEMIC_LEVELS.find((item) => item.value === academicLevel);
      const resolvedLevel = academicLevel === "other" ? customAcademicLevel.trim() : selectedLevel?.level;
      const resolvedLevelPt = academicLevel === "other" ? customAcademicLevel.trim() : selectedLevel?.levelPt;
      const selectedAdvisor = advisors.find((advisor) => advisor.id === advisorId);
      if (isStudent && (!selectedAdvisor || !resolvedLevel || !resolvedLevelPt)) {
        setError(t("auth.requiredStudentFields"));
        return false;
      }
      if (!lattes.trim() || !orcid.trim() || !scholar.trim() || !github.trim() || !labRelationshipType || !affiliationName.trim()) {
        setError(isPt ? "Preencha Lattes, ORCID, Google Scholar, GitHub, relacao com o lab e afiliacao." : "Fill in Lattes, ORCID, Google Scholar, GitHub, lab relationship, and affiliation.");
        return false;
      }
    }

    if (step === 2) {
      if (!registrationObjective.trim()) {
        setError(isPt ? "Descreva o objetivo do cadastro." : "Describe the registration objective.");
        return false;
      }
      if (!lgpdConsent) {
        setError(t("auth.lgpdRequired"));
        return false;
      }
      if (observation.length > 150) {
        setError(t("auth.observationTooLong"));
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      handleNext();
      return;
    }
    if (!validateStep(2)) return;

    const selectedLevel = ACADEMIC_LEVELS.find((item) => item.value === academicLevel);
    const resolvedLevel = academicLevel === "other" ? customAcademicLevel.trim() : selectedLevel?.level;
    const resolvedLevelPt = academicLevel === "other" ? customAcademicLevel.trim() : selectedLevel?.levelPt;
    const selectedAdvisor = advisors.find((advisor) => advisor.id === advisorId);
    setLoading(true);
    try {
      await authService.register({
        name,
        email,
        password,
        role,
        photo,
        lattes: lattes.trim(),
        orcid: orcid.trim(),
        scholar: scholar.trim(),
        github: github.trim(),
        lab_relationship_type: labRelationshipType,
        affiliation_name: affiliationName.trim(),
        advisor_id: isStudent ? advisorId : undefined,
        advisor_name: isStudent ? selectedAdvisor?.name : undefined,
        level: isStudent ? resolvedLevel : undefined,
        levelPt: isStudent ? resolvedLevelPt : undefined,
        registration_objective: registrationObjective.trim(),
        observation: observation.trim() || undefined,
        usp_number: uspNumber || undefined,
        lgpd_consent: lgpdConsent,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already registered")) {
        setError(t("auth.emailExists"));
      } else if (msg.includes("USP number already")) {
        setError(t("auth.uspNumberExists"));
      } else {
        setError(t("auth.registerError"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="glass-surface rounded-2xl border border-border p-8 shadow-xl">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">
              {t("auth.registerSuccess")}
            </h2>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6 justify-center"
          >
            <ArrowLeft size={16} />
            {t("auth.loginHere")}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <div className="glass-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <img src={logo} alt="LASDPC" className="h-10 w-10" />
            <span className="font-display font-bold text-lg text-foreground">LASDPC</span>
          </div>

          <h2 className="font-display font-bold text-2xl text-foreground mb-1">
            {t("auth.registerTitle")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t("auth.registerSubtitle")}
          </p>

          <div className="mb-7">
            <div className="relative px-2 sm:px-8" aria-label={isPt ? "Progresso do cadastro" : "Registration progress"}>
              <div className="absolute left-10 right-10 top-5 h-0.5 bg-border sm:left-16 sm:right-16">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="relative grid grid-cols-3">
                {steps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isComplete = index < currentStep;

                  return (
                    <div key={step.title} className="flex flex-col items-center text-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold shadow-sm transition-colors ${
                          isComplete
                            ? "border-primary bg-primary text-primary-foreground"
                            : isActive
                              ? "border-primary bg-background text-primary"
                              : "border-border bg-background text-muted-foreground"
                        }`}
                        aria-current={isActive ? "step" : undefined}
                      >
                        {isComplete ? <Check size={16} /> : index + 1}
                      </div>
                      <span className={`mt-2 text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 border-l-2 border-primary bg-primary/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {isPt ? `Etapa ${currentStep + 1} de ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{steps[currentStep].title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{steps[currentStep].helper}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-4"
            >
              {currentStep === 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("auth.name")}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@usp.br"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isPt ? "Foto de perfil" : "Profile photo"}</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      {photo ? (
                        <img src={mediaUrl(photo)} alt="" className="h-16 w-16 rounded-full border border-border object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary text-xs text-muted-foreground">
                          {isPt ? "Sem foto" : "No photo"}
                        </div>
                      )}
                      <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                        {uploadingPhoto ? "..." : isPt ? "Enviar foto" : "Upload photo"}
                      </Button>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(event) => handlePhotoUpload(event.target.files?.[0])}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{t("auth.role")}</Label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="aluno_ativo">{t("auth.role.aluno")}</option>
                      <option value="docente">{t("auth.role.docente")}</option>
                      <option value="alumni">{t("auth.role.alumni")}</option>
                    </select>
                  </div>
                </>
              )}

              {currentStep === 1 && (
                <>
                  {isStudent ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="advisor">{t("auth.advisor")}</Label>
                        <select
                          id="advisor"
                          value={advisorId}
                          onChange={(e) => setAdvisorId(e.target.value)}
                          className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                          required
                        >
                          <option value="">{t("auth.advisorPlaceholder")}</option>
                          {advisors.map((advisor) => (
                            <option key={advisor.id} value={advisor.id}>{advisor.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="academicLevel">{t("auth.academicLevel")}</Label>
                        <select
                          id="academicLevel"
                          value={academicLevel}
                          onChange={(e) => setAcademicLevel(e.target.value)}
                          className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                          required
                        >
                          {ACADEMIC_LEVELS.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.value === "other" ? t("auth.academicLevel.other") : (isPt ? item.levelPt : item.level)}
                            </option>
                          ))}
                        </select>
                      </div>
                      {academicLevel === "other" && (
                        <div className="space-y-2">
                          <Label htmlFor="customAcademicLevel">{t("auth.academicLevelCustom")}</Label>
                          <Input
                            id="customAcademicLevel"
                            value={customAcademicLevel}
                            onChange={(e) => setCustomAcademicLevel(e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                      {isPt
                        ? "Como docente, você pode seguir sem informar orientador ou categoria acadêmica."
                        : "As faculty, you can continue without an advisor or academic category."}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="uspNumber">{t("auth.uspNumber")}</Label>
                    <Input
                      id="uspNumber"
                      value={uspNumber}
                      onChange={(e) => setUspNumber(e.target.value)}
                      placeholder="12345678"
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lattes">Lattes URL</Label>
                      <Input id="lattes" value={lattes} onChange={(e) => setLattes(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orcid">ORCID URL</Label>
                      <Input id="orcid" value={orcid} onChange={(e) => setOrcid(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scholar">Google Scholar URL</Label>
                      <Input id="scholar" value={scholar} onChange={(e) => setScholar(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <Input id="github" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labRelationshipType">{isPt ? "Relacao com o lab" : "Relationship with the lab"}</Label>
                    <select
                      id="labRelationshipType"
                      value={labRelationshipType}
                      onChange={(e) => setLabRelationshipType(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                      required
                    >
                      <option value="academic_advisor">{isPt ? "Orientador acadêmico" : "Academic advisor"}</option>
                      <option value="usp_organization">{isPt ? "Organização da USP (Técnicos, Grupos de Extensão...)" : "USP organization (technicians, extension groups...)"}</option>
                      <option value="external_organization">{isPt ? "Organização externa (Universidade, Empresa)" : "External organization (university, company)"}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isPt ? "Nome da afiliacao/organizacao" : "Affiliation or organization name"}</Label>
                    <AffiliationInput
                      value={affiliationName}
                      onChange={setAffiliationName}
                      relationshipType={labRelationshipType}
                      placeholder={isPt ? "Digite ou selecione uma afiliacao existente" : "Type or select an existing affiliation"}
                    />
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="registrationObjective">{t("auth.registrationObjective")}</Label>
                    <textarea
                      id="registrationObjective"
                      value={registrationObjective}
                      onChange={(e) => setRegistrationObjective(e.target.value)}
                      placeholder={t("auth.registrationObjectivePlaceholder")}
                      className="w-full min-h-[90px] bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="observation">{t("auth.observation")}</Label>
                      <span className="text-xs text-muted-foreground">{observation.length}/150</span>
                    </div>
                    <textarea
                      id="observation"
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      placeholder={t("auth.observationPlaceholder")}
                      maxLength={150}
                      className="w-full min-h-[70px] bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      id="lgpdConsent"
                      type="checkbox"
                      checked={lgpdConsent}
                      onChange={(e) => setLgpdConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border"
                    />
                    <Label htmlFor="lgpdConsent" className="text-sm font-normal leading-snug">
                      {t("auth.lgpdConsent")}{" "}
                      <Link to="/privacy-policy" className="text-primary hover:underline" target="_blank">
                        {t("privacy.title")}
                      </Link>
                    </Label>
                  </div>
                </>
              )}
            </motion.div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || loading}
                className="min-w-28"
              >
                <ChevronLeft size={16} />
                {isPt ? "Voltar" : "Back"}
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNext} className="min-w-32">
                  {isPt ? "Continuar" : "Continue"}
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="min-w-40">
                  {loading ? "..." : t("auth.registerButton")}
                </Button>
              )}
            </div>
          </form>

          <p className="text-xs text-muted-foreground mt-6">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link to="/login" className="text-primary hover:underline">
              {t("auth.loginHere")}
            </Link>
          </p>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6 justify-center"
        >
          <ArrowLeft size={16} />
          {t("auth.backToHome")}
        </Link>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
