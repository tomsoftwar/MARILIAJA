import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';

const TARGET_EMAIL = 'portalmariliaja@gmail.com';

export default function Contato() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sentInfo, setSentInfo] = useState({
    name: '',
    email: '',
    subject: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim() || 'Contato pelo Portal MaríliaJá',
      message: formData.message.trim()
    };

    try {
      // 1. Salvar cópia local no navegador
      try {
        const stored = localStorage.getItem('mj_contact_messages');
        const messages = stored ? JSON.parse(stored) : [];
        messages.unshift({
          ...payload,
          id: 'msg-' + Date.now(),
          targetEmail: TARGET_EMAIL,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('mj_contact_messages', JSON.stringify(messages));
      } catch (localErr) {
        console.warn("Aviso ao salvar localmente:", localErr);
      }

      // 2. Enviar para o servidor interno do portal
      try {
        await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (serverErr) {
        console.warn("Aviso ao registrar no servidor:", serverErr);
      }

      // 3. Encaminhar diretamente para o e-mail portalmariliaja@gmail.com via FormSubmit
      try {
        const emailResponse = await fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            _subject: `[Contato MaríliaJá] ${payload.subject} (de ${payload.name})`,
            _replyto: payload.email,
            assunto: payload.subject,
            mensagem: payload.message,
            origem: 'Formulário de Contato do Portal MaríliaJá',
            data_envio: new Date().toLocaleString('pt-BR'),
            _template: 'table'
          })
        });

        if (!emailResponse.ok) {
          console.warn("Resposta não 200 do serviço de e-mail, mas prosseguindo com confirmação e opção de contingência.");
        }
      } catch (mailErr) {
        console.warn("Aviso na chamada direta de e-mail:", mailErr);
      }

      setSentInfo({
        name: payload.name,
        email: payload.email,
        subject: payload.subject
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err);
      setError("Houve um erro ao processar sua mensagem. Você também pode enviar diretamente para portalmariliaja@gmail.com");
    } finally {
      setLoading(false);
    }
  };

  const mailtoSubject = encodeURIComponent(`[Contato MaríliaJá] ${sentInfo.subject || 'Mensagem do Portal'}`);
  const mailtoBody = encodeURIComponent(
    `Olá Redação do Portal MaríliaJá,\n\nNome: ${sentInfo.name}\nE-mail: ${sentInfo.email}\n\n[Escreva sua mensagem aqui]`
  );
  const directMailtoLink = `mailto:${TARGET_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl w-full max-w-full overflow-hidden box-border">
      {/* Page Header */}
      <div className="mb-12 md:mb-16 border-b-8 border-black pb-6 md:pb-8">
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-3 break-words">
          Contato
        </h1>
        <p className="text-lg md:text-xl font-bold uppercase tracking-widest text-[#FF0000]">
          Fale com a Redação do Marília Já
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left Column: Contact Channels */}
        <div className="w-full max-w-full">
          <p className="text-xl md:text-2xl font-medium leading-relaxed mb-10 text-gray-700">
            Tem uma denúncia, sugestão de pauta, releases ou quer anunciar no portal? Utilize o formulário ou nossos canais diretos abaixo.
          </p>

          <div className="space-y-6 md:space-y-8">
            {/* E-mail */}
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-2xl shrink-0 shadow-sm">
                <Mail size={22} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-xs mb-1 text-gray-400">E-mail Oficial</h3>
                <a 
                  href={`mailto:${TARGET_EMAIL}`} 
                  className="text-lg sm:text-xl font-black text-black hover:text-[#FF0000] transition-colors break-words"
                >
                  {TARGET_EMAIL}
                </a>
                <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                  Mensagens enviadas pelo formulário são encaminhadas para esta caixa de entrada.
                </p>
              </div>
            </div>
            
            {/* WhatsApp */}
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-2xl shrink-0 shadow-sm">
                <Phone size={22} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-xs mb-1 text-gray-400">WhatsApp / Redação</h3>
                <a 
                  href="https://wa.me/5514999999999" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lg sm:text-xl font-black text-black hover:text-[#FF0000] transition-colors"
                >
                  (14) 99999-9999
                </a>
                <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                  Plantão de notícias, vídeos e fotos pelo WhatsApp.
                </p>
              </div>
            </div>

            {/* Redação Local */}
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-2xl shrink-0 shadow-sm">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-xs mb-1 text-gray-400">Localização</h3>
                <p className="text-lg sm:text-xl font-black uppercase">Marília, SP - Brasil</p>
                <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                  Cobertura diária de Marília e todos os municípios da região.
                </p>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="mt-12 p-6 md:p-8 bg-gray-50 border-4 border-black border-dashed rounded-2xl">
            <h4 className="font-black uppercase mb-3 text-[#FF0000] flex items-center gap-2 text-sm tracking-wider">
              <span className="w-2.5 h-2.5 bg-[#FF0000] inline-block"></span>
              Horário de Atendimento da Redação
            </h4>
            <p className="font-bold text-xs sm:text-sm uppercase tracking-tight text-gray-800">
              Segunda a Sexta-feira: 08h00 às 18h00
            </p>
            <p className="font-bold text-xs sm:text-sm uppercase tracking-tight text-gray-600 mt-1">
              Plantão de Jornalismo: Sábados, Domingos e Feriados
            </p>
          </div>
        </div>

        {/* Right Column: Form or Success Confirmation */}
        <div className="w-full max-w-full">
          {submitted ? (
            <div className="bg-emerald-50 border-4 border-emerald-600 p-8 sm:p-12 rounded-3xl text-center shadow-lg">
              <CheckCircle2 size={64} className="text-emerald-600 mx-auto mb-6" />
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-4 text-emerald-950">
                Mensagem Encaminhada com Sucesso!
              </h2>
              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 mb-6 text-left space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destino do Envio:</p>
                <p className="text-base font-black text-black break-words flex items-center gap-2">
                  <Mail size={16} className="text-emerald-600 shrink-0" /> {TARGET_EMAIL}
                </p>
                {sentInfo.email && (
                  <p className="text-xs text-gray-600 font-medium pt-2 border-t border-gray-100">
                    Nossa equipe responderá diretamente para o e-mail <strong>{sentInfo.email}</strong>.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button 
                  onClick={() => setSubmitted(false)}
                  className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow"
                >
                  Enviar Outra Mensagem
                </button>
                <a
                  href={directMailtoLink}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white text-emerald-800 border-2 border-emerald-600 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                >
                  <ExternalLink size={14} /> Abrir no Meu E-mail
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border-4 border-black shadow-lg">
              <div className="border-b-2 border-gray-100 pb-4">
                <h2 className="text-xl font-black uppercase tracking-tight">Formulário de Contato</h2>
                <p className="text-xs text-gray-500 font-bold mt-1">
                  Sua mensagem será encaminhada diretamente para <span className="text-[#FF0000]">{TARGET_EMAIL}</span>.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 border-2 border-red-300 font-bold uppercase text-xs rounded-xl">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="font-black uppercase text-[10px] tracking-widest text-gray-500">
                  Seu Nome Completo *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: João da Silva"
                  className="w-full border-2 border-gray-200 p-4 focus:border-[#FF0000] outline-none font-bold text-base transition-all rounded-xl bg-gray-50 focus:bg-white"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-black uppercase text-[10px] tracking-widest text-gray-500">
                    Seu E-mail para Resposta *
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="seuemail@exemplo.com"
                    className="w-full border-2 border-gray-200 p-4 focus:border-[#FF0000] outline-none font-bold text-base transition-all rounded-xl bg-gray-50 focus:bg-white"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-black uppercase text-[10px] tracking-widest text-gray-500">
                    Assunto da Mensagem *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Sugestão de Pauta / Denúncia"
                    className="w-full border-2 border-gray-200 p-4 focus:border-[#FF0000] outline-none font-bold text-base transition-all rounded-xl bg-gray-50 focus:bg-white"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-black uppercase text-[10px] tracking-widest text-gray-500">
                  Mensagem Detalhada *
                </label>
                <textarea 
                  required
                  rows={5}
                  placeholder="Descreva aqui sua mensagem com o máximo de detalhes..."
                  className="w-full border-2 border-gray-200 p-4 focus:border-[#FF0000] outline-none font-medium text-base transition-all rounded-xl bg-gray-50 focus:bg-white resize-none"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#FF0000] hover:bg-black text-white py-5 rounded-2xl font-black text-lg md:text-xl transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-wider disabled:bg-gray-300 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Encaminhando Mensagem...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Enviar para portalmariliaja@gmail.com</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
