import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function Contato() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Save message locally
      const stored = localStorage.getItem('mj_contact_messages');
      const messages = stored ? JSON.parse(stored) : [];
      messages.unshift({
        ...formData,
        id: 'msg-' + Date.now(),
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('mj_contact_messages', JSON.stringify(messages));

      // 2. Open email client to send to sitemariliaja@gmail.com
      const mailtoSubject = encodeURIComponent(`[Contato MaríliaJá] ${formData.subject}`);
      const mailtoBody = encodeURIComponent(
        `Nome: ${formData.name}\nE-mail: ${formData.email}\nAssunto: ${formData.subject}\n\nMensagem:\n${formData.message}`
      );
      const mailtoLink = `mailto:sitemariliaja@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
      
      // Trigger mailto link
      window.location.href = mailtoLink;

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err);
      setError("Houve um erro ao processar sua mensagem. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="mb-16 border-b-8 border-black pb-8">
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4">Contato</h1>
        <p className="text-xl font-bold uppercase tracking-widest text-[#FF0000]">Fale com o Marília Já</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <p className="text-2xl font-medium leading-relaxed mb-12 text-gray-700">
            Tem uma denúncia, sugestão de pauta ou quer anunciar no portal? Utilize o formulário ao lado ou nossos canais diretos.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-2xl shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-xs mb-1 text-gray-400">E-mail</h3>
                <p className="text-xl font-black">sitemariliaja@gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-2xl shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-xs mb-1 text-gray-400">WhatsApp</h3>
                <p className="text-xl font-black">(14) 99999-9999</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-2xl shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-xs mb-1 text-gray-400">Redação</h3>
                <p className="text-xl font-black uppercase">Marília, SP - Brasil</p>
              </div>
            </div>
          </div>

          <div className="mt-16 p-8 bg-gray-50 border-4 border-black border-dashed">
            <h4 className="font-black uppercase mb-4 text-[#FF0000]">Horário de Atendimento</h4>
            <p className="font-bold text-sm uppercase tracking-tight">Segunda a Sexta: 08h às 18h</p>
            <p className="font-bold text-sm uppercase tracking-tight">Plantão: Sábados e Domingos</p>
          </div>
        </div>

        <div>
          {submitted ? (
            <div className="bg-green-50 border-4 border-green-600 p-12 rounded-3xl text-center">
              <CheckCircle2 size={64} className="text-green-600 mx-auto mb-6" />
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-green-900">Mensagem Enviada!</h2>
              <p className="text-green-800 font-bold mb-8">
                Agradecemos seu contato. Sua mensagem foi direcionada para sitemariliaja@gmail.com e responderemos o mais breve possível.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="bg-green-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all"
              >
                Enviar nova mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 border-2 border-red-200 font-bold uppercase text-xs">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="font-black uppercase text-[10px] tracking-widest text-gray-400 italic">Seu Nome</label>
                <input 
                  type="text" 
                  required
                  placeholder="COMO DEVEMOS TE CHAMAR?"
                  className="w-full border-4 border-gray-100 p-5 focus:border-[#FF0000] outline-none font-black text-lg transition-all rounded-2xl"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-black uppercase text-[10px] tracking-widest text-gray-400 italic">E-mail</label>
                  <input 
                    type="email" 
                    required
                    placeholder="PARA ONDE RESPONDEMOS?"
                    className="w-full border-4 border-gray-100 p-5 focus:border-[#FF0000] outline-none font-black text-lg transition-all rounded-2xl"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-black uppercase text-[10px] tracking-widest text-gray-400 italic">Assunto</label>
                  <input 
                    type="text" 
                    required
                    placeholder="QUAL O MOTIVO?"
                    className="w-full border-4 border-gray-100 p-5 focus:border-[#FF0000] outline-none font-black text-lg transition-all rounded-2xl"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-black uppercase text-[10px] tracking-widest text-gray-400 italic">Mensagem</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="ESCREVA AQUI SUA MENSAGEM COM O MÁXIMO DE DETALHES..."
                  className="w-full border-4 border-gray-100 p-5 focus:border-[#FF0000] outline-none font-medium text-lg transition-all rounded-2xl resize-none"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF0000] text-white py-8 rounded-3xl font-black text-2xl hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-4 uppercase tracking-tighter disabled:bg-gray-200"
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={24} />
                    Enviar Mensagem
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
