import { ChevronDown, ChevronUp, ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  AdminButton,
  AdminFormActions,
  AdminNotice,
  AdminTextareaField,
  AdminTextField,
  AdminToggleField,
} from "./adminShared";
import api from "../../services/api";
import { resolveAssetUrl } from "../../services/assets";
import {
  getApiErrorMessage,
  type PaginatedResponse,
} from "../../services/http";

type Category = {
  id: number;
  name: string;
};

type GameImage = {
  id: number;
  imageUrl?: string;
  sortOrder?: number;
};

type GameResponse = {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  releaseDate: string;
  coverImageUrl: string;
  isActive?: boolean;
  categories?: Category[];
  images?: GameImage[];
};

type GameValues = {
  title: string;
  description: string;
  longDescription: string;
  releaseDate: string;
  coverImageUrl: string;
  isActive: boolean;
  categoryIds: number[];
};

type GalleryItem = {
  key: string;
  kind: "existing" | "file" | "url";
  imageUrl: string;
  previewUrl: string;
  id?: number;
  file?: File;
};

const emptyGame: GameValues = {
  title: "",
  description: "",
  longDescription: "",
  releaseDate: "",
  coverImageUrl: "",
  isActive: true,
  categoryIds: [],
};

function createGalleryKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function createExistingGalleryItem(image: GameImage): GalleryItem {
  const imageUrl = String(image.imageUrl ?? "").trim();

  return {
    key: `existing-${image.id}`,
    kind: "existing",
    id: image.id,
    imageUrl,
    previewUrl: resolveAssetUrl(imageUrl),
  };
}

function createFileGalleryItem(file: File): GalleryItem {
  const previewUrl = URL.createObjectURL(file);

  return {
    key: `file-${createGalleryKey()}`,
    kind: "file",
    imageUrl: "",
    previewUrl,
    file,
  };
}

function createUrlGalleryItem(imageUrl: string): GalleryItem {
  return {
    key: `url-${createGalleryKey()}`,
    kind: "url",
    imageUrl,
    previewUrl: resolveAssetUrl(imageUrl),
  };
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

export default function AdminGameForm({ id }: { id?: string }) {
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const galleryItemsRef = useRef<GalleryItem[]>([]);
  const [values, setValues] = useState<GameValues>(emptyGame);
  const [categories, setCategories] = useState<Category[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("/utils/logo.png");
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    galleryItemsRef.current = galleryItems;
  }, [galleryItems]);

  useEffect(
    () => () => {
      for (const galleryItem of galleryItemsRef.current) {
        if (galleryItem.kind === "file") {
          URL.revokeObjectURL(galleryItem.previewUrl);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (coverFile) {
      const objectUrl = URL.createObjectURL(coverFile);
      setCoverPreviewUrl(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }

    setCoverPreviewUrl(resolveAssetUrl(values.coverImageUrl));
  }, [coverFile, values.coverImageUrl]);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const categoryRequest = api.get<PaginatedResponse<Category>>("/categories", {
          params: { page: 1, limit: 100 },
        });

        const [categoryResponse, gameResponse] = await Promise.all([
          categoryRequest,
          id ? api.get<GameResponse>(`/games/${id}`) : Promise.resolve(null),
        ]);

        setCategories(categoryResponse.data.items ?? []);

        if (!gameResponse) {
          setValues(emptyGame);
          setGalleryItems([]);
          setCoverFile(null);
          return;
        }

        const game = gameResponse.data;

        setValues({
          title: game.title ?? "",
          description: game.description ?? "",
          longDescription: game.longDescription ?? "",
          releaseDate: game.releaseDate ?? "",
          coverImageUrl: game.coverImageUrl ?? "",
          isActive: game.isActive !== false,
          categoryIds: (game.categories ?? []).map((category) => category.id),
        });
        setGalleryItems((game.images ?? []).map(createExistingGalleryItem));
        setCoverFile(null);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(error, "Não foi possível carregar o formulário do jogo."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFormData();
  }, [id]);

  const selectedCategories = useMemo(
    () =>
      categories.filter((category) => values.categoryIds.includes(category.id)),
    [categories, values.categoryIds],
  );

  const setField = <Field extends keyof GameValues>(
    field: Field,
    value: GameValues[Field],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const toggleCategory = (categoryId: number) => {
    setValues((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  };

  const addGalleryFiles = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const nextItems = Array.from(files).map(createFileGalleryItem);
    setGalleryItems((current) => [...current, ...nextItems]);
  };

  const addGalleryUrl = () => {
    const imageUrl = galleryUrlInput.trim();

    if (!imageUrl) {
      return;
    }

    setGalleryItems((current) => [...current, createUrlGalleryItem(imageUrl)]);
    setGalleryUrlInput("");
  };

  const removeGalleryItem = (itemKey: string) => {
    setGalleryItems((current) => {
      const item = current.find((candidate) => candidate.key === itemKey);

      if (item?.kind === "file") {
        URL.revokeObjectURL(item.previewUrl);
      }

      return current.filter((candidate) => candidate.key !== itemKey);
    });
  };

  const moveGalleryItem = (itemKey: string, direction: -1 | 1) => {
    setGalleryItems((current) => {
      const currentIndex = current.findIndex((item) => item.key === itemKey);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      return moveItem(current, currentIndex, nextIndex);
    });
  };

  const saveGame = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = values.title.trim();
    const description = values.description.trim();
    const longDescription = values.longDescription.trim();
    const releaseDate = values.releaseDate.trim();
    const coverImageUrl = values.coverImageUrl.trim();

    if (!title || !description || !longDescription || !releaseDate) {
      setErrorMessage("Preencha título, descrições e data de lançamento.");
      return;
    }

    if (values.categoryIds.length === 0) {
      setErrorMessage("Selecione pelo menos uma categoria.");
      return;
    }

    if (!coverFile && !coverImageUrl) {
      setErrorMessage("Envie uma capa ou informe uma URL de fallback.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("longDescription", longDescription);
      formData.append("releaseDate", releaseDate);
      formData.append("isActive", String(values.isActive));
      formData.append("categoryIds", JSON.stringify(values.categoryIds));

      if (coverImageUrl) {
        formData.append("coverImageUrl", coverImageUrl);
      }

      if (coverFile) {
        formData.append("coverFile", coverFile);
      }

      const galleryFiles: File[] = [];
      const galleryPayload = galleryItems.map((galleryItem) => {
        if (galleryItem.kind === "existing") {
          return {
            kind: "existing",
            id: galleryItem.id,
          };
        }

        if (galleryItem.kind === "url") {
          return {
            kind: "url",
            url: galleryItem.imageUrl,
          };
        }

        const fileIndex = galleryFiles.push(galleryItem.file as File) - 1;

        return {
          kind: "file",
          fileIndex,
        };
      });

      formData.append("galleryItems", JSON.stringify(galleryPayload));
      galleryFiles.forEach((file) => formData.append("galleryFiles", file));

      if (isEditing) {
        await api.put(`/games/${id}`, formData);
        void navigate("/admin/games");
        return;
      }

      const { data } = await api.post<GameResponse>("/games", formData);
      void navigate(`/admin/games/${data.id}/platforms`);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível salvar o jogo."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      title={isEditing ? "Editar jogo" : "Novo jogo"}
      description="Cadastre os dados editoriais do jogo, envie a capa principal, monte a galeria e vincule as categorias no mesmo formulário."
      backTo="/admin/games"
      backLabel="Voltar para jogos"
    >
      {isLoading ? (
        <p className="text-slate-300">Carregando formulário...</p>
      ) : (
        <form onSubmit={saveGame} className="grid gap-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="space-y-5">
              <section className="rounded-[28px] border border-slate-800 bg-slate-950/82 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <AdminTextField
                      label="Título"
                      type="text"
                      value={values.title}
                      onChange={({ target }) => setField("title", target.value)}
                      required
                    />
                  </div>

                  <AdminTextField
                    label="Data de lançamento"
                    type="date"
                    value={values.releaseDate}
                    onChange={({ target }) => setField("releaseDate", target.value)}
                    required
                  />

                  <div className="flex items-end">
                    <AdminToggleField
                      label="Jogo ativo"
                      checked={values.isActive}
                      onChange={(checked) => setField("isActive", checked)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <AdminTextareaField
                    label="Descrição curta"
                    value={values.description}
                    onChange={({ target }) => setField("description", target.value)}
                    className="min-h-28"
                    required
                  />
                </div>

                <div className="mt-4">
                  <AdminTextareaField
                    label="Descrição longa"
                    value={values.longDescription}
                    onChange={({ target }) => setField("longDescription", target.value)}
                    className="min-h-44"
                    required
                  />
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950/82 p-5">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-blue-200" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Capa principal</h2>
                    <p className="text-sm text-slate-400">
                      O fluxo principal é por arquivo. A URL fica como alternativa discreta.
                    </p>
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-700 bg-slate-900/45 px-6 py-8 text-center text-slate-300 transition hover:border-blue-400/45 hover:bg-slate-900/70">
                  <ImagePlus className="h-8 w-8 text-blue-200" />
                  <span className="mt-3 text-base font-medium text-white">
                    {coverFile ? coverFile.name : "Clique para enviar a capa"}
                  </span>
                  <span className="mt-1 text-sm text-slate-400">
                    JPG, PNG ou WEBP. O arquivo enviado tem prioridade sobre a URL.
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={({ target }) =>
                      setCoverFile(target.files?.[0] ?? null)
                    }
                  />
                </label>

                {coverFile && (
                  <div className="mt-3 flex justify-end">
                    <AdminButton
                      type="button"
                      tone="secondary"
                      onClick={() => setCoverFile(null)}
                    >
                      Remover arquivo da capa
                    </AdminButton>
                  </div>
                )}

                <details className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                  <summary className="cursor-pointer list-none text-sm font-medium text-slate-200">
                    Usar URL de fallback
                  </summary>
                  <div className="mt-4">
                    <AdminTextField
                      label="URL da capa"
                      type="url"
                      value={values.coverImageUrl}
                      onChange={({ target }) => setField("coverImageUrl", target.value)}
                      note="Use apenas quando não quiser enviar um arquivo agora."
                    />
                  </div>
                </details>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950/82 p-5">
                <div className="flex items-center gap-3">
                  <ImagePlus className="h-5 w-5 text-blue-200" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Galeria</h2>
                    <p className="text-sm text-slate-400">
                      Envie imagens extras, adicione URLs quando necessário e organize a ordem visual da página do jogo.
                    </p>
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-700 bg-slate-900/45 px-6 py-7 text-center text-slate-300 transition hover:border-blue-400/45 hover:bg-slate-900/70">
                  <Upload className="h-7 w-7 text-blue-200" />
                  <span className="mt-3 text-base font-medium text-white">
                    Adicionar imagens da galeria
                  </span>
                  <span className="mt-1 text-sm text-slate-400">
                    Você pode selecionar várias imagens de uma vez.
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={({ target }) => addGalleryFiles(target.files)}
                  />
                </label>

                <details className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                  <summary className="cursor-pointer list-none text-sm font-medium text-slate-200">
                    Adicionar imagem da galeria por URL
                  </summary>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1">
                      <AdminTextField
                        label="URL da galeria"
                        type="url"
                        value={galleryUrlInput}
                        onChange={({ target }) => setGalleryUrlInput(target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <AdminButton type="button" tone="secondary" onClick={addGalleryUrl}>
                        <Link2 className="mr-2 h-4 w-4" />
                        Adicionar URL
                      </AdminButton>
                    </div>
                  </div>
                </details>

                {galleryItems.length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/35 p-4 text-sm text-slate-300">
                    Nenhuma imagem extra adicionada. A galeria é opcional.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {galleryItems.map((galleryItem, index) => (
                      <article
                        key={galleryItem.key}
                        className="rounded-[24px] border border-slate-800 bg-slate-900/50 p-4"
                      >
                        <img
                          src={galleryItem.previewUrl}
                          alt={`Galeria ${index + 1}`}
                          className="h-40 w-full rounded-[18px] border border-slate-800 object-cover"
                        />

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {galleryItem.kind === "existing"
                                ? "Imagem atual"
                                : galleryItem.kind === "file"
                                  ? galleryItem.file?.name
                                  : "Imagem por URL"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Ordem {index + 1}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <AdminButton
                              type="button"
                              tone="secondary"
                              disabled={index === 0}
                              onClick={() => moveGalleryItem(galleryItem.key, -1)}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </AdminButton>
                            <AdminButton
                              type="button"
                              tone="secondary"
                              disabled={index === galleryItems.length - 1}
                              onClick={() => moveGalleryItem(galleryItem.key, 1)}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </AdminButton>
                            <AdminButton
                              type="button"
                              tone="subtleDanger"
                              onClick={() => removeGalleryItem(galleryItem.key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </AdminButton>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950/82 p-5">
                <h2 className="text-lg font-semibold text-white">Categorias</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Selecione pelo menos uma categoria para este jogo.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {categories.map((category) => {
                    const selected = values.categoryIds.includes(category.id);

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          selected
                            ? "border-blue-400/50 bg-blue-500/15 text-blue-100"
                            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-28 xl:h-fit">
              <section className="rounded-[28px] border border-slate-800 bg-slate-950/82 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200/80">
                  Preview
                </p>
                <img
                  src={coverPreviewUrl}
                  alt={values.title || "Preview do jogo"}
                  className="mt-4 h-60 w-full rounded-[24px] border border-slate-800 object-cover"
                />

                <h2 className="mt-4 text-2xl font-semibold text-white">
                  {values.title || "Título do jogo"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {values.description || "A descrição curta aparecerá aqui para revisão rápida."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedCategories.length === 0 ? (
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">
                      Sem categorias
                    </span>
                  ) : (
                    selectedCategories.map((category) => (
                      <span
                        key={category.id}
                        className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100"
                      >
                        {category.name}
                      </span>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950/82 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200/80">
                  Galeria
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  {galleryItems.length} imagem(ns) extra(s) configurada(s).
                </p>

                {galleryItems.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {galleryItems.slice(0, 6).map((galleryItem) => (
                      <img
                        key={galleryItem.key}
                        src={galleryItem.previewUrl}
                        alt="Miniatura da galeria"
                        className="h-20 w-full rounded-2xl border border-slate-800 object-cover"
                      />
                    ))}
                  </div>
                )}
              </section>
            </aside>
          </div>

          {errorMessage && <AdminNotice>{errorMessage}</AdminNotice>}

          <AdminFormActions
            backTo="/admin/games"
            saving={isSaving}
            submitLabel={isEditing ? "Salvar jogo" : "Salvar e monitorar plataformas"}
          />
        </form>
      )}
    </AdminLayout>
  );
}
