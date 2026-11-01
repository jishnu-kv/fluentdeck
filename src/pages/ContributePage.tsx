import React, { useState } from 'react';
import { ContributeIcon, AddIcon, CoffeeIcon } from '@/components/Icons';
import { NEW_PULL_REQUEST_URL, BUY_ME_A_COFFEE_URL } from '@/constants';
import Seo from '@/components/Seo';

const designTags = [
	{ tag: 'WD', label: 'WinUI 3', desc: 'App follows the WinUI 3 design language.' },
	{ tag: 'WDM', label: 'Mica', desc: 'App features Mica material.' },
	{ tag: 'WDA', label: 'Acrylic', desc: 'App features Acrylic material.' },
];

const otherTags = [
	{ tag: 'FOSS', desc: 'Free and Open Source Software.', mono: true },
	{ tag: '💰', desc: 'Paid Apps!', mono: false },
	{ tag: '🎨', desc: 'Theme!', mono: false },
	{ tag: '📆', desc: 'Planned: Apps that are in development.', mono: false },
	{ tag: '❎', desc: 'Discontinued: App is paused indefinitely.', mono: false },
];

const ContributePage: React.FC = () => {
	const [copied, setCopied] = useState(false);
	const template = `- \`WDM\` [Your App Name](https://github.com/username/repo) <sup>\`FOSS\`</sup> <!-- logo: https://raw.githubusercontent.com/.../StoreLogo.png -->`;

	const handleCopy = () => {
		navigator.clipboard.writeText(template);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<>
			<Seo
				title="Contribute to Fluent Deck"
				description="Add your WinUI 3 app to our showcase, suggest new features, or support the project. Learn how to contribute via GitHub and help grow the Fluent Design community."
				keywords="Contribute, Open Source, WinUI, Fluent Design, GitHub, Add App"
				canonical="/contribute"
				image="/assets/cover-contribute.png"
				imageAlt="Instructions on how to contribute to the Fluent Deck project on GitHub."
			/>

			<div className="py-8 px-4 sm:px-6 lg:px-8">
				<div className="max-w-5xl mx-auto">
					{/* Standard Page Title Header */}
					<div className="flex items-center space-x-3 mb-2">
						<ContributeIcon />
						<h1 className="text-3xl sm:text-4xl font-bold text-text-primary">
							Contribute
						</h1>
					</div>

					<p className="mt-2 text-base text-text-secondary max-w-3xl">
						Got a WinUI 3 app? Adding it to Fluent Deck is simple. Follow the three steps below to submit your app to the catalog.
					</p>

					{/* Action Bar */}
					<div className="mt-8 rounded-xl p-4 bg-bg-secondary border border-border-primary flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="text-sm">
							<span className="font-semibold text-text-primary">Ready to submit?</span>
							<span className="text-text-secondary ml-1.5 hidden sm:inline">Fork the repository and open a pull request.</span>
						</div>
						<div className="flex items-center gap-3 shrink-0">
							<a
								href="https://github.com/jishnu-kv/WinUI-Apps-List"
								target="_blank"
								rel="noopener noreferrer"
								className="px-4 py-2 text-sm font-semibold text-text-primary bg-bg-secondary border border-border-primary rounded-lg hover:bg-bg-active transition-colors"
							>
								View GitHub Repo
							</a>
							<a
								href={NEW_PULL_REQUEST_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="px-4 py-2 text-sm font-semibold text-bg-primary bg-accent rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
							>
								<AddIcon />
								<span>Create Pull Request</span>
							</a>
						</div>
					</div>

					{/* 3 Step Guide Cards */}
					<div className="mt-8 space-y-6">
						{/* STEP 1 */}
						<div className="rounded-xl bg-bg-secondary border border-border-primary p-6">
							<div className="flex items-center gap-3 mb-4">
								<span className="flex items-center justify-center w-7 h-7 rounded-full bg-bg-active text-text-primary text-xs font-bold border border-border-primary">
									1
								</span>
								<h2 className="text-xl font-bold text-text-primary">Fork the Repository</h2>
							</div>
							<p className="text-sm text-text-secondary leading-relaxed mb-4">
								Visit the{' '}
								<a
									href="https://github.com/jishnu-kv/WinUI-Apps-List"
									target="_blank"
									rel="noopener noreferrer"
									className="text-text-link hover:underline font-medium"
								>
									WinUI-Apps-List repository
								</a>{' '}
								on GitHub and click the "Fork" button in the upper right corner to create your own copy.
							</p>
							<img
								src="/assets/contribute/fork.webp"
								alt="GitHub fork button location"
								className="rounded-lg border border-border-primary w-full max-w-3xl"
								width={1280}
								height={720}
								loading="lazy"
							/>
						</div>

						{/* STEP 2 */}
						<div className="rounded-xl bg-bg-secondary border border-border-primary p-6">
							<div className="flex items-center gap-3 mb-4">
								<span className="flex items-center justify-center w-7 h-7 rounded-full bg-bg-active text-text-primary text-xs font-bold border border-border-primary">
									2
								</span>
								<h2 className="text-xl font-bold text-text-primary">Add Your App to README.md</h2>
							</div>
							<p className="text-sm text-text-secondary leading-relaxed mb-4">
								Open <code>README.md</code> in your fork and find the category that fits your app. Insert your app entry in alphabetical order.
							</p>

							{/* Format & Example Box */}
							<div className="rounded-xl bg-card-primary border border-border-primary p-4 mb-6">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Markdown Format</span>
									<button
										onClick={handleCopy}
										className="text-xs px-2.5 py-1 rounded bg-bg-active text-text-primary hover:bg-border-primary transition-colors"
									>
										{copied ? 'Copied ✓' : 'Copy Template'}
									</button>
								</div>
								<pre className="text-xs font-mono text-text-primary bg-bg-secondary p-3 rounded border border-border-primary overflow-x-auto whitespace-pre-wrap break-all">
									<code>{template}</code>
								</pre>
							</div>

							{/* Tag Tables matching original clean layout */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<h3 className="text-sm font-semibold text-text-primary mb-2">Design Language Tags</h3>
									<div className="overflow-hidden rounded-lg border border-border-primary">
										<table className="w-full text-sm divide-y divide-border-primary">
											<thead className="bg-bg-active">
												<tr>
													<th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-text-primary w-24">Tag</th>
													<th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-text-primary">Description</th>
												</tr>
											</thead>
											<tbody className="bg-bg-secondary divide-y divide-border-primary">
												{designTags.map((item) => (
													<tr key={item.tag}>
														<td className="px-4 py-3 font-mono text-xs font-semibold text-text-primary">{item.tag}</td>
														<td className="px-4 py-3 text-text-secondary text-xs">{item.desc}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>

								<div>
									<h3 className="text-sm font-semibold text-text-primary mb-2">Pricing & Status Tags</h3>
									<div className="overflow-hidden rounded-lg border border-border-primary">
										<table className="w-full text-sm divide-y divide-border-primary">
											<thead className="bg-bg-active">
												<tr>
													<th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-text-primary w-24">Tag</th>
													<th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-text-primary">Description</th>
												</tr>
											</thead>
											<tbody className="bg-bg-secondary divide-y divide-border-primary">
												{otherTags.map((item, i) => (
													<tr key={i}>
														<td className="px-4 py-3 font-semibold text-xs text-text-primary">{item.tag}</td>
														<td className="px-4 py-3 text-text-secondary text-xs">{item.desc}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>

						{/* STEP 3 */}
						<div className="rounded-xl bg-bg-secondary border border-border-primary p-6">
							<div className="flex items-center gap-3 mb-4">
								<span className="flex items-center justify-center w-7 h-7 rounded-full bg-bg-active text-text-primary text-xs font-bold border border-border-primary">
									3
								</span>
								<h2 className="text-xl font-bold text-text-primary">Create Pull Request</h2>
							</div>
							<p className="text-sm text-text-secondary leading-relaxed mb-4">
								Submit your pull request on GitHub. Once merged, our automated GitHub Actions workflow will automatically parse your app details, optimize your logo to WebP, and publish it on Fluent Deck.
							</p>
							<img
								src="/assets/contribute/pull-request.webp"
								alt="GitHub pull request button location"
								className="rounded-lg border border-border-primary w-full max-w-3xl"
								width={1280}
								height={720}
								loading="lazy"
							/>
						</div>
					</div>

					{/* Missing Icons Section */}
					<div className="mt-8 rounded-xl bg-bg-secondary border border-border-primary p-5 flex gap-4 items-start">
						<div className="text-text-secondary pt-0.5" aria-hidden="true">
							<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5">
								<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
							</svg>
						</div>
						<div className="text-sm leading-relaxed">
							<h3 className="font-semibold text-text-primary mb-1">
								Missing Icons?
							</h3>
							<p className="text-text-secondary">
								Fluent Deck uses the official{' '}
								<a
									href="https://github.com/microsoft/fluentui-system-icons"
									className="text-text-link hover:underline font-medium"
									target="_blank"
									rel="noopener noreferrer"
								>
									Fluent UI System Icons
								</a>.
								If you find missing icons or updated upstream icons,{' '}
								<a
									href="https://github.com/jishnu-kv/fluentdeck/issues"
									className="text-text-link hover:underline font-medium"
									target="_blank"
									rel="noopener noreferrer"
								>
									create an issue
								</a> and we will update the set.
							</p>
						</div>
					</div>

					{/* Support Section */}
					<div className="mt-8 pt-8 border-t border-border-primary text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4">
						<div>
							<h3 className="text-lg font-bold text-text-primary">Support the Project</h3>
							<p className="text-sm text-text-secondary mt-1">
								Fluent Deck is open source and free. If you find it useful, consider supporting future development.
							</p>
						</div>
						<a
							href={BUY_ME_A_COFFEE_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-4 sm:mt-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 font-semibold text-sm text-text-primary bg-bg-secondary border border-border-primary rounded-lg hover:bg-bg-active transition-colors shrink-0"
						>
							<CoffeeIcon className="w-4 h-4 text-amber-500" />
							<span>Buy me a coffee</span>
						</a>
					</div>
				</div>
			</div>
		</>
	);
};

export default ContributePage;
