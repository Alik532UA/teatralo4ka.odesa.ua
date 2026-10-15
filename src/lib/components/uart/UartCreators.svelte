<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale } from 'svelte-i18n';

	const isEn = $derived($locale === 'en');
</script>

<div class="creators-box">
	<h4 class="creators-title">{isEn ? 'Directors & Teachers' : 'Постановники'}</h4>
	<ul class="creators-list">
		<li>
			<a
				href={resolve('/residents/adults/[slug]', { slug: 'fedir-tkach' })}
				class="creator-link"
				data-testid="uart-master-fedir-tkach-link"
			>
				<strong>{isEn ? 'Fedir Tkach' : 'Федір Ткач'}</strong>
			</a>
			<span class="creator-role">— {isEn ? 'Artistic director, stage director' : 'Художній керівник, режисер'}</span>
		</li>
		<li>
			<a
				href={resolve('/residents/adults/[slug]', { slug: 'pavlo-prymak' })}
				class="creator-link"
				data-testid="uart-master-pavlo-prymak-link"
			>
				<strong>{isEn ? 'Pavlo Prymak' : 'Павло Примак'}</strong>
			</a>
			<span class="creator-role">— {isEn ? 'Co-director, stage movement, actor' : 'Сорежисер, сценічний рух, актор'}</span>
		</li>
	</ul>
</div>

<style>
	.creators-box {
		border-top: 1px solid var(--border-main);
		padding-top: 1.25rem;
	}
	.creators-title {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin: 0 0 0.65rem;
	}
	.creators-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.925rem;
	}
	.creator-link {
		color: var(--accent-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.creator-role {
		color: var(--text-muted);
	}
</style>
