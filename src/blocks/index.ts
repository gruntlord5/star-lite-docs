import DocsTabs from "./DocsTabs.astro";
import DocsLinkCard from "./DocsLinkCard.astro";
import DocsCardGrid from "./DocsCardGrid.astro";
import DocsAside from "./DocsAside.astro";
import DocsCard from "./DocsCard.astro";
import DocsBadge from "./DocsBadge.astro";
import DocsFileTree from "./DocsFileTree.astro";
import DocsIcon from "./DocsIcon.astro";
import DocsLinkButton from "./DocsLinkButton.astro";
import DocsSteps from "./DocsSteps.astro";
import DocsHtml from "./DocsHtml.astro";
import DocsHero from "./DocsHero.astro";
import DocsImage from "./DocsImage.astro";
import CodeBlock from "../CodeBlock.astro";

/** Generic doc block components — Starlight equivalents */
export const blockComponents = {
	"docs.html": DocsHtml,
	"docs.hero": DocsHero,
	"docs.image": DocsImage,
	"code": CodeBlock,
	"star-lite.tabs": DocsTabs,
	"star-lite.linkCard": DocsLinkCard,
	"star-lite.cardGrid": DocsCardGrid,
	"star-lite.aside": DocsAside,
	"star-lite.card": DocsCard,
	"star-lite.badge": DocsBadge,
	"star-lite.fileTree": DocsFileTree,
	"star-lite.icon": DocsIcon,
	"star-lite.linkButton": DocsLinkButton,
	"star-lite.steps": DocsSteps,
};
