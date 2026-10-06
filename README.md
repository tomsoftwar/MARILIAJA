# Portal de Notícias MARÍLIAJÁ 📰 (GitHub Pages Edition)

Portal de Notícias e Informações de Marília e Região, adaptado para rodar **100% no GitHub Pages** sem necessidade de Firebase, servidor externo ou banco de dados pago!

Desenvolvido com **React**, **TypeScript**, **Tailwind CSS**, **Vite** e arquitetura **Git CMS** (conteúdo versionado e persistente).

---

## 🚀 Funcionalidades

- **Página Inicial (Home)**:
  - Notícias em destaque com carrossel/banner principal.
  - Grade de notícias agrupadas por categorias (*Cidade, Polícia, Política, Variedades, Região*).
  - Espaços publicitários (ADS) integrados no Topo, Meio, Lateral e Rodapé.
- **Leitura de Notícias**:
  - Matéria completa com renderização de HTML rico (negrito, itálico, listas, links externos).
  - Inserção de imagens com legendas e vídeos do YouTube/Vimeo.
  - Assinatura do autor / créditos.
  - Banners de ADS responsivos.
- **Painel Administrativo & Área do Editor (`#/postar`)**:
  - Publicação de novas notícias com editor visual completo (*ReactQuill*).
  - Gerenciamento de notícias (edição e exclusão).
  - Filtro "Todas as Notícias" e "Minhas Notícias".
  - **Controle de permissões baseado em funções (RBAC)**:
    - *Administrador*: Controle total para gerenciar, editar e excluir qualquer notícia.
    - *Colaborador (Editor)*: Pode publicar e editar/excluir exclusivamente as próprias matérias.
  - **Gestão de Colaboradores**: Cadastro e revogação de acessos de novos redatores e jornalistas.
- **Sincronização com o GitHub (Git CMS)**:
  - Salva as notícias instantaneamente no navegador.
  - **Sincronização em 1 clique**: Envia os commits do catálogo de notícias (`public/data/news.json`) diretamente para o repositório do GitHub via GitHub REST API!
  - **Download de Backup**: Botão para baixar o arquivo `news.json` a qualquer momento.
- **Autenticação Descentralizada**:
  - Acesso direto de Administrador com usuário master (`admin` ou `tomsoftwar`).
  - Acesso com GitHub Personal Access Token (PAT).
  - Cadastro de colaboradores com login individual.
- **Páginas Institucionais**:
  - Quem Somos, Políticas de Privacidade, Termos de Uso, Anuncie no MJ e Contato (com formulário direcionado para `sitemariliaja@gmail.com`).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Roteamento**: [React Router](https://reactrouter.com/) com `HashRouter` (garante zero erros 404 no GitHub Pages)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Editor Rico**: [ReactQuill New](https://github.com/zenoamaro/react-quill)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Hospedagem & CI/CD**: [GitHub Pages](https://pages.github.com/) + [GitHub Actions](https://github.com/features/actions)

---

## 🐙 Como Publicar no GitHub Pages (Passo a Passo)

### 1. Crie o repositório no GitHub
1. Acesse [github.com/new](https://github.com/new).
2. Nome do repositório: `portal-mariliaja` (ou o nome de sua preferência).
3. Deixe como **Público** e clique em **Create repository**.

### 2. Envie o código do seu computador para o GitHub
```bash
# Vincular seu repositório remoto
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# Garantir a branch principal
git branch -M main

# Subir todos os arquivos
git push -u origin main
```

### 3. Ativar o GitHub Pages no Repositório
1. No seu repositório no GitHub, clique na aba **Settings** (Configurações).
2. No menu lateral esquerdo, clique em **Pages**.
3. Em **Build and deployment** > **Source**, selecione:
   - **`GitHub Actions`**.
4. Pronto! O workflow `.github/workflows/deploy.yml` que já criamos no projeto fará o build e colocará o site no ar automaticamente em `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

---

## 💻 Como Rodar Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd portal-mariliaja

# 2. Instalar dependências
npm install

# 3. Rodar em desenvolvimento
npm run dev

# 4. Gerar build para produção
npm run build
```

---

## 📄 Licença
Todos os direitos reservados ao Portal MARÍLIAJÁ.
