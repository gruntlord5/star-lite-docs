import { definePlugin } from "emdash";

export function createPlugin() {
	return definePlugin({
		id: "star-lite-blocks",
		version: "1.0.0",
		capabilities: ["read:content"],

		admin: {
			portableTextBlocks: [
				{
					type: "docs.image",
					label: "Image",
					icon: "link",
					description: "Standalone image",
					fields: [
						{ type: "text_input", action_id: "src", label: "Image URL" },
						{ type: "text_input", action_id: "alt", label: "Alt text" },
					],
				},
				{
					type: "docs.hero",
					label: "Hero",
					icon: "link",
					description: "Splash homepage hero (title, tagline, image, actions)",
					fields: [
						{ type: "text_input", action_id: "title", label: "Title (leave empty to use page title)" },
						{ type: "text_input", action_id: "tagline", label: "Tagline" },
						{ type: "text_input", action_id: "imageSrc", label: "Image URL" },
						{ type: "text_input", action_id: "imageAlt", label: "Image alt text" },
						{ type: "text_input", action_id: "actionsJson", label: "Actions (JSON: [{text, link, icon, variant}])" },
					],
				},
				{
					type: "star-lite.tabs",
					label: "Tabs",
					icon: "link",
					description: "Tabbed content",
					fields: [
						{ type: "text_input", action_id: "id", label: "Section ID" },
						{ type: "text_input", action_id: "tabsJson", label: "Tabs (JSON: [{label, icon, content}])" },
					],
				},
				{
					type: "star-lite.linkCard",
					label: "Link Card",
					icon: "link",
					description: "Navigation card with title and link",
					fields: [
						{ type: "text_input", action_id: "id", label: "Section ID" },
						{ type: "text_input", action_id: "title", label: "Title" },
						{ type: "text_input", action_id: "href", label: "URL" },
						{ type: "text_input", action_id: "description", label: "Description" },
						{ type: "text_input", action_id: "target", label: "Target (_blank)" },
					],
				},
				{
					type: "star-lite.cardGrid",
					label: "Card Grid",
					icon: "link",
					description: "Grid of cards",
					fields: [
						{ type: "text_input", action_id: "id", label: "Section ID" },
						{ type: "text_input", action_id: "cardsJson", label: "Cards (JSON)" },
					],
				},
				{
					type: "star-lite.aside",
					label: "Aside / Callout",
					icon: "link",
					description: "Callout box (note, tip, caution, danger)",
					fields: [
						{ type: "text_input", action_id: "type", label: "Type (note, tip, caution, danger)" },
						{ type: "text_input", action_id: "title", label: "Title" },
						{ type: "text_input", action_id: "content", label: "Content" },
					],
				},
				{
					type: "star-lite.card",
					label: "Card",
					icon: "link",
					description: "Content card with optional icon and color",
					fields: [
						{ type: "text_input", action_id: "title", label: "Title" },
						{ type: "text_input", action_id: "icon", label: "Icon name" },
						{ type: "text_input", action_id: "color", label: "Color (purple, orange, green, red, blue)" },
						{ type: "text_input", action_id: "content", label: "Content" },
						{ type: "text_input", action_id: "embedComponent", label: "Embed Component" },
						{ type: "text_input", action_id: "embedProps", label: "Embed Props (JSON)" },
					],
				},
				{
					type: "star-lite.badge",
					label: "Badge",
					icon: "link",
					description: "Inline status badge",
					fields: [
						{ type: "text_input", action_id: "text", label: "Badge text" },
						{ type: "text_input", action_id: "variant", label: "Variant" },
						{ type: "text_input", action_id: "size", label: "Size (small, medium, large)" },
					],
				},
				{
					type: "star-lite.fileTree",
					label: "File Tree",
					icon: "link",
					description: "File and directory tree display",
					fields: [
						{ type: "text_input", action_id: "treeHtml", label: "Tree HTML" },
					],
				},
				{
					type: "star-lite.icon",
					label: "Icon",
					icon: "link",
					description: "Inline icon",
					fields: [
						{ type: "text_input", action_id: "name", label: "Icon name" },
						{ type: "text_input", action_id: "label", label: "Accessible label" },
						{ type: "text_input", action_id: "size", label: "Size" },
					],
				},
				{
					type: "star-lite.linkButton",
					label: "Link Button",
					icon: "link",
					description: "Styled link as a button",
					fields: [
						{ type: "text_input", action_id: "text", label: "Button text" },
						{ type: "text_input", action_id: "href", label: "URL" },
						{ type: "text_input", action_id: "icon", label: "Icon name" },
						{ type: "text_input", action_id: "variant", label: "Variant (primary, secondary, minimal)" },
					],
				},
				{
					type: "star-lite.steps",
					label: "Steps",
					icon: "link",
					description: "Numbered step-by-step instructions",
					fields: [
						{ type: "text_input", action_id: "stepsJson", label: "Steps (JSON: [{content}])" },
					],
				},
				{
					type: "docs.diagram",
					label: "Diagram (draw.io)",
					icon: "link",
					description: "Editable draw.io diagram stored as SVG",
					fields: [
						{ type: "text_input", action_id: "svg", label: "SVG content" },
						{ type: "text_input", action_id: "xml", label: "draw.io XML source" },
					],
				},
			],
		},
	});
}

export default createPlugin;
