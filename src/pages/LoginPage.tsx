import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import { FAKE_PROFILES } from '../services/authService';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import fiaLogoDarkImg from '../assets/fia-logo-dark.png';
import fiaLogoLimeImg from '../assets/fia-logo-lime.png';
import teamHandsImg from '../assets/team-hands.jpg';

const loginSchema = z.object({
  email: z.string().min(1, 'O e-mail é obrigatório').email('Insira um e-mail válido institucional'),
  senha: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoFilledRole, setAutoFilledRole] = useState<'admin' | 'aluno' | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  // Se já estiver logado, redireciona para a área adequada
  if (user) {
    if (user.tipo === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/aluno/recomendacoes" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMessage(null);
      const loggedUser = await login(data.email, data.senha);

      if (loggedUser.tipo === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/aluno/recomendacoes', { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Falha ao autenticar. Verifique suas credenciais.');
      }
    }
  };

  // Preenchimento rápido dos perfis solicitados
  const handleFillCredentials = (role: 'admin' | 'aluno') => {
    const profile = FAKE_PROFILES.find((p) => p.role === role);
    if (profile) {
      setValue('email', profile.email, { shouldValidate: true });
      setValue('senha', profile.senha, { shouldValidate: true });
      setAutoFilledRole(role);
      setErrorMessage(null);
    }
  };

  return (
    <div className="h-screen w-full max-w-full overflow-hidden flex flex-col lg:flex-row bg-white font-sans text-left">
      {/* ========================================================================= */}
      {/* DIV ESQUERDA: Formulário de Login & Credenciais de Acesso */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-5 sm:p-7 md:p-8 lg:p-7 xl:p-10 2xl:p-12 order-2 lg:order-1 bg-white text-left overflow-y-auto overflow-x-hidden">
        {/* Topo / Header da coluna esquerda */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 xl:mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={fiaLogoDarkImg}
              alt="FIA Business School"
              className="h-8 xl:h-9 w-auto object-contain shrink-0"
            />
            <div className="flex flex-col text-left pl-2.5 border-l border-slate-200">
              <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                Talent Hub
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#142d59] font-semibold mt-1">
                Business School
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eef3fa] text-[#142d59] border border-[#c8d8ee]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#142d59]" />
            Portal Corporativo • Acesso Seguro
          </span>
        </div>

        {/* Centro / Formulário */}
        <div className="relative z-10 max-w-md w-full mx-auto my-auto py-1 xl:py-2 text-left">
          <div className="mb-4 xl:mb-5 text-left">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-fia-tea mb-1">
              Saber para agir • Agir para impactar
            </span>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tighter text-slate-900 text-left">
              Acesse sua conta
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed text-left">
              Plataforma de carreiras e oportunidades da FIA Business School. Conectando o ambiente acadêmico às principais lideranças do mercado.
            </p>
          </div>

          {/* Feedback de erro */}
          {errorMessage && (
            <div className="mb-3.5 p-3 bg-red-50/90 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="leading-snug text-left">
                <span className="font-semibold block mb-0.5">Credenciais Não Reconhecidas</span>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 xl:space-y-3.5 text-left">
            {/* Campo E-mail */}
            <div className="text-left">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1 text-left"
              >
                E-mail Institucional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  {...register('email')}
                  className={`w-full text-xs sm:text-sm pl-10 pr-3.5 py-2 xl:py-2.5 bg-slate-50/70 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.email
                    ? 'border-red-300 focus:ring-red-100 focus:border-red-500'
                    : 'border-slate-300 focus:ring-fia-deep/15 focus:border-fia-deep'
                    }`}
                  placeholder="adm@teste.com.br ou aluno@teste.com.br"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-600 mt-1 font-medium text-left">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="text-left">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="senha"
                  className="block text-xs font-semibold text-slate-700 text-left"
                >
                  Senha de Acesso
                </label>
                <span className="text-[11px] text-slate-400">
                  Sensível a maiúsculas
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('senha')}
                  className={`w-full text-xs sm:text-sm pl-10 pr-10 py-2 xl:py-2.5 bg-slate-50/70 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.senha
                    ? 'border-red-300 focus:ring-red-100 focus:border-red-500'
                    : 'border-slate-300 focus:ring-fia-deep/15 focus:border-fia-deep'
                    }`}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-[11px] text-red-600 mt-1 font-medium text-left">
                  {errors.senha.message}
                </p>
              )}
            </div>

            {/* Botão de Entrar em Azul FIA com ícone Verde Decidido */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1.5 flex items-center justify-center gap-2 py-2.5 xl:py-3 px-4 rounded-lg bg-[#142d59] hover:bg-[#0f2347] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer border border-[#142d59]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando credenciais...</span>
                </>
              ) : (
                <>
                  <span>Entrar na Plataforma</span>
                  <ArrowRight className="w-4 h-4 text-fia-lime" />
                </>
              )}
            </button>
          </form>

          {/* Perfis Fake e Atalhos para Teste */}
          <div className="mt-4 pt-3.5 xl:mt-5 xl:pt-4 border-t border-slate-200/80 text-left">
            <div className="flex items-center justify-between mb-2 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 text-left">
                <Sparkles className="w-3.5 h-3.5 text-[#142d59]" />
                Perfis de Demonstração (Clique para preencher)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Botão de Atalho Admin (Azul FIA) */}
              <button
                type="button"
                onClick={() => handleFillCredentials('admin')}
                className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                  autoFilledRole === 'admin'
                    ? 'border-[#142d59] bg-[#eef3fa] ring-1 ring-[#142d59]'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-[#eef3fa]/60 hover:border-[#142d59]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#142d59]" />
                    <span className="text-xs font-semibold text-slate-800">
                      Administrador
                    </span>
                  </div>
                  {autoFilledRole === 'admin' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#142d59]" />
                  )}
                </div>
                <div className="mt-1 space-y-0.5 text-[11px] text-left">
                  <p className="text-slate-600 font-mono">
                    <span className="text-slate-400">e-mail: </span>adm@teste.com.br
                  </p>
                  <p className="text-slate-600 font-mono">
                    <span className="text-slate-400">senha: </span>@13setTESTE
                  </p>
                </div>
              </button>

              {/* Botão de Atalho Aluno */}
              <button
                type="button"
                onClick={() => handleFillCredentials('aluno')}
                className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${autoFilledRole === 'aluno'
                  ? 'border-fia-deep bg-fia-sereno/40 ring-1 ring-fia-deep'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-fia-deep" />
                    <span className="text-xs font-semibold text-slate-800">
                      Aluno FIA
                    </span>
                  </div>
                  {autoFilledRole === 'aluno' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-fia-deep" />
                  )}
                </div>
                <div className="mt-1 space-y-0.5 text-[11px] text-left">
                  <p className="text-slate-600 font-mono">
                    <span className="text-slate-400">e-mail: </span>aluno@teste.com.br
                  </p>
                  <p className="text-slate-600 font-mono">
                    <span className="text-slate-400">senha: </span>@13setAluno
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé da coluna esquerda */}
        <div className="pt-3 xl:pt-4 border-t border-slate-100 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
          <p>© {new Date().getFullYear()} FIA Business School • Quem sabe lidera.</p>
          <p className="text-[11px] text-slate-400">Plataforma Acadêmica Institucional</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DIV DIREITA: Fotografia Editorial + Logo Equilibrada FIA (Manual Oficial) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-8 xl:p-10 order-1 lg:order-2 relative overflow-hidden text-left bg-slate-950">
        {/* Fotografia Institucional: Visibilidade Natural com Textura */}
        <img
          src={teamHandsImg}
          alt="Colaboração e Liderança FIA Business School"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 filter contrast-110 saturate-60"
        />

        {/* Gradiente Suavizado (Mais Leve, Sem Pesar o Fundo) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/65 pointer-events-none" />

        {/* Topo da div direita: Badge de prestígio acadêmico */}
        <div className="relative z-10 flex items-center justify-between shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-fia-lime" />
            FIA Business School
          </span>
          <span className="text-[11px] text-white/80 font-medium tracking-wider uppercase drop-shadow-xs">
            Portal Oficial de Carreiras
          </span>
        </div>

        {/* Centro: Logo da FIA Proporcional e Equilibrada */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-4 xl:py-6 w-full">
          <div className="w-full max-w-[170px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px] xl:max-w-[260px] flex flex-col items-start">
            <div className="transition-transform duration-300 hover:scale-[1.02] w-full">
              <img
                src={fiaLogoLimeImg}
                alt="FIA Business School"
                className="w-full h-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
              />
            </div>

            {/* Divisor sutil em Verde Decidido alinhado à esquerda */}
            <div className="h-0.5 w-10 bg-gradient-to-r from-fia-lime to-fia-lime/20 my-2.5 xl:my-3 rounded-full" />

            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-fia-lime drop-shadow-sm text-left">
              Quem sabe lidera.
            </p>
          </div>
        </div>

        {/* Rodapé da div direita: Card translúcido com o propósito oficial */}
        <div className="relative z-10 p-4 xl:p-5 rounded-xl bg-black/35 border border-white/15 backdrop-blur-md max-w-md shadow-xl text-left shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fia-lime">
              SABER PARA AGIR, AGIR PARA IMPACTAR
            </span>
          </div>
          <p className="text-xs font-medium leading-relaxed tracking-tight text-white text-left">
            Conectando a formação de excelência da FIA às melhores posições e desafios reais do mercado corporativo.
          </p>
          <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-2 text-[10px] text-slate-300 uppercase tracking-wider">
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">Profunda</span>
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">Realizadora</span>
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">Instigante</span>
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">Acolhedora</span>
          </div>
        </div>
      </div>
    </div>
  );
};
