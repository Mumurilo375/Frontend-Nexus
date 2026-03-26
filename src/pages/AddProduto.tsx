import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/globals/NavBar";
import Footer from "../components/globals/Footer";
import api from "../services/api";

type Game = {
	id: number;
	title: string;
	description: string;
	longDescription: string;
	releaseDate: string;
	coverImageUrl: string;
	isActive?: boolean;
};

type GamesResponse = {
	items: Game[];
	meta?: {
		page?: number;
		limit?: number;
		total?: number;
		totalPages?: number;
	};
};

type GameFormData = {
	title: string;
	description: string;
	longDescription: string;
	releaseDate: string;
	coverImageUrl: string;
};

const initialForm: GameFormData = {
	title: "",
	description: "",
	longDescription: "",
	releaseDate: "",
	coverImageUrl: "",
};

export default function AddProduto() {
	const [games, setGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [editingGameId, setEditingGameId] = useState<number | null>(null);
	const [formData, setFormData] = useState<GameFormData>(initialForm);

	const isEditing = useMemo(() => editingGameId !== null, [editingGameId]);

	const loadGames = async () => {
		try {
			setLoading(true);
			setError("");

			const { data } = await api.get<GamesResponse>("/games", {
				params: { page: 1, limit: 100 },
			});

			setGames(data?.items ?? []);
		} catch {
			setGames([]);
			setError("Nao foi possivel carregar os jogos.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadGames();
	}, []);

	const resetForm = () => {
		setFormData(initialForm);
		setEditingGameId(null);
	};

	const handleFieldChange = (field: keyof GameFormData, value: string) => {
		setFormData((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		try {
			setSaving(true);
			setError("");
			setSuccess("");

			if (isEditing && editingGameId) {
				await api.put(`/games/${editingGameId}`, formData);
				setSuccess("Game atualizado com sucesso.");
			} else {
				await api.post("/games", formData);
				setSuccess("Game criado com sucesso.");
			}

			resetForm();
			await loadGames();
		} catch {
			setError("Nao foi possivel salvar o game. Verifique os campos e tente novamente.");
		} finally {
			setSaving(false);
		}
	};

	const startEdit = (game: Game) => {
		setSuccess("");
		setError("");
		setEditingGameId(game.id);
		setFormData({
			title: game.title ?? "",
			description: game.description ?? "",
			longDescription: game.longDescription ?? "",
			releaseDate: String(game.releaseDate ?? "").slice(0, 10),
			coverImageUrl: game.coverImageUrl ?? "",
		});
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleDelete = async (id: number) => {
		try {
			setDeletingId(id);
			setError("");
			setSuccess("");

			await api.delete(`/games/${id}`);
			setGames((current) => current.filter((game) => game.id !== id));

			if (editingGameId === id) {
				resetForm();
			}

			setSuccess("Game removido com sucesso.");
		} catch {
			setError("Nao foi possivel remover o game.");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="min-h-screen bg-[#09090b] text-gray-100">
			<NavBar />

			<main className="mx-auto w-full max-w-7xl px-6 pb-12 pt-28">
				<header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="text-3xl font-bold">CRUD de Games</h1>
						<p className="mt-2 text-sm text-gray-300">
							Cadastre, edite e remova jogos disponiveis na loja.
						</p>
					</div>

					<Link
						to="/loja"
						className="inline-flex w-fit items-center rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-600"
					>
						Voltar para loja
					</Link>
				</header>

				{error && (
					<p className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
						{error}
					</p>
				)}

				{success && (
					<p className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
						{success}
					</p>
				)}

				<section className="mb-8 rounded-2xl border border-white/10 bg-[#111827] p-5">
					<div className="mb-4 flex items-center justify-between gap-3">
						<h2 className="text-xl font-semibold">
							{isEditing ? "Editar game" : "Adicionar novo game"}
						</h2>

						{isEditing && (
							<button
								type="button"
								onClick={resetForm}
								className="rounded-lg bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
							>
								Cancelar edicao
							</button>
						)}
					</div>

					<form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
						<label className="flex flex-col gap-2 text-sm">
							Titulo
							<input
								type="text"
								required
								value={formData.title}
								onChange={(event) => handleFieldChange("title", event.target.value)}
								className="rounded-lg border border-gray-700 bg-black/40 px-3 py-2 outline-none focus:border-blue-500"
							/>
						</label>

						<label className="flex flex-col gap-2 text-sm">
							Data de lancamento
							<input
								type="date"
								required
								value={formData.releaseDate}
								onChange={(event) => handleFieldChange("releaseDate", event.target.value)}
								className="rounded-lg border border-gray-700 bg-black/40 px-3 py-2 outline-none focus:border-blue-500"
							/>
						</label>

						<label className="flex flex-col gap-2 text-sm md:col-span-2">
							URL da capa
							<input
								type="url"
								required
								value={formData.coverImageUrl}
								onChange={(event) => handleFieldChange("coverImageUrl", event.target.value)}
								placeholder="https://..."
								className="rounded-lg border border-gray-700 bg-black/40 px-3 py-2 outline-none focus:border-blue-500"
							/>
						</label>

						<label className="flex flex-col gap-2 text-sm md:col-span-2">
							Descricao curta
							<textarea
								required
								value={formData.description}
								onChange={(event) => handleFieldChange("description", event.target.value)}
								rows={2}
								className="rounded-lg border border-gray-700 bg-black/40 px-3 py-2 outline-none focus:border-blue-500"
							/>
						</label>

						<label className="flex flex-col gap-2 text-sm md:col-span-2">
							Descricao longa
							<textarea
								required
								value={formData.longDescription}
								onChange={(event) => handleFieldChange("longDescription", event.target.value)}
								rows={4}
								className="rounded-lg border border-gray-700 bg-black/40 px-3 py-2 outline-none focus:border-blue-500"
							/>
						</label>

						<div className="md:col-span-2">
							<button
								type="submit"
								disabled={saving}
								className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
							>
								{saving
									? "Salvando..."
									: isEditing
										? "Salvar alteracoes"
										: "Criar game"}
							</button>
						</div>
					</form>
				</section>

				<section className="rounded-2xl border border-white/10 bg-[#111827] p-5">
					<h2 className="mb-4 text-xl font-semibold">Jogos cadastrados</h2>

					{loading ? (
						<p className="text-gray-300">Carregando jogos...</p>
					) : games.length === 0 ? (
						<p className="text-gray-300">Nenhum game cadastrado.</p>
					) : (
						<div className="space-y-3">
							{games.map((game) => (
								<article
									key={game.id}
									className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-4 md:flex-row md:items-center md:justify-between"
								>
									<div className="min-w-0 flex-1">
										<h3 className="truncate text-lg font-semibold">{game.title}</h3>
										<p className="mt-1 text-sm text-gray-300">
											Lancamento: {String(game.releaseDate).slice(0, 10)}
										</p>
										<p
											className="mt-1 text-sm text-gray-400"
											style={{
												display: "-webkit-box",
												WebkitLineClamp: 2,
												WebkitBoxOrient: "vertical",
												overflow: "hidden",
											}}
										>
											{game.description}
										</p>
									</div>

									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => startEdit(game)}
											className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
										>
											Editar
										</button>

										<button
											type="button"
											onClick={() => {
												void handleDelete(game.id);
											}}
											disabled={deletingId === game.id}
											className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
										>
											{deletingId === game.id ? "Removendo..." : "Excluir"}
										</button>
									</div>
								</article>
							))}
						</div>
					)}
				</section>
			</main>

			<Footer />
		</div>
	);
}
