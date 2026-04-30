import { useLang } from "@/contexts/LanguageContext";

const PrivacyPolicyPage = () => {
  const { lang } = useLang();
  const isPt = lang === "pt-BR";

  return (
    <div className="py-10">
      <div className="container mx-auto px-4 max-w-3xl prose prose-sm dark:prose-invert">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">
          {isPt ? "Politica de Privacidade" : "Privacy Policy"}
        </h1>

        {isPt ? (
          <>
            <p className="text-muted-foreground text-xs mb-6">Versao 1.0 - Abril 2026</p>

            <h2>1. Dados Coletados</h2>
            <p>Coletamos os seguintes dados pessoais para operacao do sistema:</p>
            <ul>
              <li><strong>Dados de identificacao:</strong> nome, e-mail, numero USP</li>
              <li><strong>Dados academicos:</strong> funcao (docente/aluno/egresso), area de pesquisa, nivel academico, ano de ingresso, ano de formatura</li>
              <li><strong>Dados de perfil:</strong> biografia, habilidades, foto de perfil</li>
              <li><strong>Links profissionais:</strong> LinkedIn, GitHub, Twitter/X, ResearchGate, Lattes, ORCID, Google Scholar</li>
              <li><strong>Dados de autenticacao:</strong> senha (armazenada de forma criptografada)</li>
            </ul>

            <h2>2. Finalidade do Tratamento</h2>
            <p>Os dados sao utilizados exclusivamente para:</p>
            <ul>
              <li>Identificacao e autenticacao no sistema</li>
              <li>Exibicao do perfil no site do laboratorio</li>
              <li>Gestao academica e administrativa do LASDPC</li>
              <li>Comunicacao entre membros do laboratorio</li>
            </ul>

            <h2>3. Direitos do Titular (LGPD Art. 18)</h2>
            <p>Voce tem direito a:</p>
            <ul>
              <li><strong>Acesso:</strong> consultar todos os dados que mantemos sobre voce</li>
              <li><strong>Retificacao:</strong> corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Portabilidade:</strong> exportar seus dados em formato legivel por maquina</li>
              <li><strong>Eliminacao:</strong> solicitar a exclusao dos seus dados pessoais</li>
              <li><strong>Revogacao do consentimento:</strong> retirar seu consentimento a qualquer momento</li>
            </ul>

            <h2>4. Como Exercer seus Direitos</h2>
            <p>Voce pode exercer seus direitos diretamente pelo sistema:</p>
            <ul>
              <li>Acesse seu perfil e utilize os botoes &quot;Exportar meus dados&quot; e &quot;Solicitar exclusao&quot;</li>
              <li>Solicitacoes de exclusao serao analisadas por um administrador</li>
              <li>Em caso de exclusao, seus dados serao anonimizados para preservar a integridade do sistema</li>
            </ul>

            <h2>5. Responsavel pelo Tratamento</h2>
            <p>
              LASDPC - Laboratorio de Sistemas Distribuidos e Programacao Concorrente<br />
              ICMC-USP, Av. Trabalhador Sao-Carlense, 400 - Sao Carlos, SP<br />
              Contato: lasdpc@icmc.usp.br
            </p>

            <h2>6. Seguranca</h2>
            <p>Adotamos medidas tecnicas e organizacionais para proteger seus dados, incluindo criptografia de senhas e controle de acesso baseado em funcoes.</p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-xs mb-6">Version 1.0 - April 2026</p>

            <h2>1. Data Collected</h2>
            <p>We collect the following personal data to operate the system:</p>
            <ul>
              <li><strong>Identification data:</strong> name, email, USP number</li>
              <li><strong>Academic data:</strong> role (faculty/student/alumni), research area, academic level, year joined, graduation year</li>
              <li><strong>Profile data:</strong> biography, skills, profile photo</li>
              <li><strong>Professional links:</strong> LinkedIn, GitHub, Twitter/X, ResearchGate, Lattes, ORCID, Google Scholar</li>
              <li><strong>Authentication data:</strong> password (stored encrypted)</li>
            </ul>

            <h2>2. Purpose of Data Processing</h2>
            <p>Data is used exclusively for:</p>
            <ul>
              <li>Identification and authentication in the system</li>
              <li>Displaying profiles on the lab website</li>
              <li>Academic and administrative management of LASDPC</li>
              <li>Communication between lab members</li>
            </ul>

            <h2>3. Data Subject Rights (LGPD Art. 18)</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> view all data we hold about you</li>
              <li><strong>Rectification:</strong> correct incomplete, inaccurate, or outdated data</li>
              <li><strong>Portability:</strong> export your data in a machine-readable format</li>
              <li><strong>Deletion:</strong> request the deletion of your personal data</li>
              <li><strong>Consent withdrawal:</strong> revoke your consent at any time</li>
            </ul>

            <h2>4. How to Exercise Your Rights</h2>
            <p>You can exercise your rights directly through the system:</p>
            <ul>
              <li>Go to your profile and use the &quot;Export my data&quot; and &quot;Request deletion&quot; buttons</li>
              <li>Deletion requests will be reviewed by an administrator</li>
              <li>In case of deletion, your data will be anonymized to preserve system integrity</li>
            </ul>

            <h2>5. Data Controller</h2>
            <p>
              LASDPC - Distributed Systems and Concurrent Programming Laboratory<br />
              ICMC-USP, Av. Trabalhador Sao-Carlense, 400 - Sao Carlos, SP, Brazil<br />
              Contact: lasdpc@icmc.usp.br
            </p>

            <h2>6. Security</h2>
            <p>We adopt technical and organizational measures to protect your data, including password encryption and role-based access control.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
