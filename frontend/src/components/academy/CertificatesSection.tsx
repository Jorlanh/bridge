import { Award, Download, Clock, CheckCircle, Inbox } from "lucide-react";

interface Certificate {
  id: string;
  title: string;
  course: string;
  earnedAt: string;
  studyTime: string;
  status: "earned" | "in-progress";
  certificateUrl?: string;
}

interface CertificatesSectionProps {
  certificates: {
    earned: Certificate[];
    inProgress: Certificate[];
  };
}

export function CertificatesSection({ certificates }: CertificatesSectionProps) {
  const earnedCertificates = certificates.earned;
  const inProgressCertificates = certificates.inProgress;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl mb-2 flex items-center gap-2">
          <Award className="w-6 h-6 text-secondary" />
          Certificados
        </h2>
        <p className="text-muted-foreground">
          Certificados conquistados pelo seu tempo de estudo
        </p>
      </div>

      {/* Earned Certificates */}
      {earnedCertificates.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Conquistados ({earnedCertificates.length})
          </h3>
          <div className="grid gap-4">
            {earnedCertificates.map((cert) => (
              <div
                key={cert.id}
                className="glass-card p-5 border-success/30 bg-success/5 hover:bg-success/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center shrink-0">
                      <Award className="w-7 h-7 text-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{cert.title}</h4>
                      <p className="text-sm text-muted-foreground">{cert.course}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cert.studyTime}
                        </span>
                        <span>Conquistado em {cert.earnedAt}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors shrink-0">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Award className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">Nenhum certificado conquistado</h3>
          <p className="text-sm text-muted-foreground">
            Complete os cursos para receber seus certificados!
          </p>
        </div>
      )}

      {/* In Progress Certificates */}
      {inProgressCertificates.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Em progresso ({inProgressCertificates.length})
          </h3>
          <div className="grid gap-4">
            {inProgressCertificates.map((cert) => (
              <div
                key={cert.id}
                className="glass-card p-5 border-warning/30 bg-warning/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                    <Award className="w-7 h-7 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{cert.title}</h4>
                    <p className="text-sm text-muted-foreground">{cert.course}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Tempo de estudo: {cert.studyTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      
      {/* Mensagem quando não há certificados e nem em progresso */}
      {earnedCertificates.length === 0 && inProgressCertificates.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Inbox className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-xl mb-2">Nenhum certificado disponível</h3>
          <p className="text-muted-foreground">
            Complete os cursos para receber seus certificados!
          </p>
        </div>
      )}
    </div>
  );
}
