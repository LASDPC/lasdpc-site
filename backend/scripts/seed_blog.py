"""Public blog posts based on the project sources and the website meeting notes."""

from datetime import date

from models.blog import BlogPostCreate


def build_posts() -> list[dict]:
    published = date.today().isoformat()
    return [
        BlogPostCreate(
            title="LASDPC website brings research and lab services together",
            titlePt="Site do LASDPC reúne pesquisa e serviços do laboratório",
            excerpt="The renewed site brings together lab history, people, research, publications and online services.",
            excerptPt="O site renovado reúne história, pessoas, pesquisa, publicações e serviços online do laboratório.",
            content=(
                "# One place for the lab\n\n"
                "The LASDPC website has been rebuilt with a bilingual interface and an administrative area for managing people, projects, publications, infrastructure and blog posts. "
                "Members can access internal documentation after signing in.\n\n"
                "The site also includes room reservations and search and filters for people, research and blog content. "
                "These features were developed during the website project meetings held from March to May 2026.\n\n"
                "Explore the sections to learn about the lab's work and available resources."
            ),
            contentPt=(
                "# Um lugar para conhecer o laboratório\n\n"
                "O site do LASDPC foi reformulado com interface bilíngue e uma área administrativa para gerenciar pessoas, projetos, publicações, infraestrutura e notícias. "
                "Integrantes podem acessar a documentação interna após entrar na plataforma.\n\n"
                "O site também oferece reserva de salas e busca e filtros nas páginas de pessoas, pesquisa e blog. "
                "Esses recursos foram desenvolvidos ao longo das reuniões do projeto realizadas entre março e maio de 2026.\n\n"
                "Explore as seções para conhecer as atividades e os recursos do laboratório."
            ),
            date=published,
            tag="Laboratory",
            category="Notícias",
            author="Equipe LASDPC",
        ).model_dump(),
        BlogPostCreate(
            title="Smart-LaSDPC studies IoT for intelligent buildings",
            titlePt="Smart-LaSDPC pesquisa IoT para edifícios inteligentes",
            excerpt="The Smart-LaSDPC project explores software architecture for sensing and managing building environments.",
            excerptPt="O projeto Smart-LaSDPC explora arquitetura de software para sensoriamento e gestão de ambientes prediais.",
            content=(
                "# Smart-LaSDPC\n\n"
                "Smart-LaSDPC studies how Internet of Things components can support intelligent building environments. "
                "Its software architecture connects sensors, data processing and services in the lab's research context.\n\n"
                "The project page describes the architecture and links to its website and code. "
                "Two related publications from 2024 are listed in the Research section."
            ),
            contentPt=(
                "# Smart-LaSDPC\n\n"
                "O Smart-LaSDPC pesquisa como componentes de Internet das Coisas podem apoiar ambientes prediais inteligentes. "
                "Sua arquitetura de software conecta sensores, processamento de dados e serviços no contexto da pesquisa do laboratório.\n\n"
                "A página do projeto descreve a arquitetura e reúne links para o site e o código. "
                "Duas publicações relacionadas, de 2024, aparecem na seção Pesquisa."
            ),
            date=published,
            tag="Research",
            category="Pesquisa",
            author="Equipe LASDPC",
        ).model_dump(),
    ]
