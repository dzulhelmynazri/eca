"use client";

import { useForm } from "@tanstack/react-form";
import { FileTextIcon, GlobeIcon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	createKnowledgeSourceInputSchema,
	knowledgeSourceNameSchema,
} from "@use-forever/contracts";
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentMedia,
	AttachmentTitle,
	AttachmentTrigger,
} from "@use-forever/ui/components/attachment";
import { Button } from "@use-forever/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@use-forever/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@use-forever/ui/components/input-group";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@use-forever/ui/components/sheet";
import { ToggleGroup, ToggleGroupItem } from "@use-forever/ui/components/toggle-group";
import { toast } from "sonner";
import { z } from "zod";
import { queryClient, trpc } from "@/utils/trpc";

type KnowledgeSourceType = "file" | "website";

const EMPTY_FORM = {
	name: "",
	websiteUrl: "",
};

const SUPPORTED_FILE_TYPES = ".pdf,.doc,.docx,.xlsx,.txt,.html";
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ADD_KNOWLEDGE_SOURCE_FORM_SCHEMA = z.object({
	name: knowledgeSourceNameSchema,
	websiteUrl: z.string().trim(),
});

function formatFileSize(bytes: number) {
	if (bytes >= 1024 * 1024) {
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
	return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function AddSheet() {
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [sourceType, setSourceType] = useState<KnowledgeSourceType>("file");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const createKnowledgeSourceMutation = useMutation(
		trpc.knowledge.create.mutationOptions({
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const createKnowledgeSourceForm = useForm({
		defaultValues: EMPTY_FORM,
		validators: {
			onSubmit: ADD_KNOWLEDGE_SOURCE_FORM_SCHEMA,
		},
		onSubmit: async ({ value }) => {
			if (isSubmitting) {
				return;
			}

			const normalizedValue = ADD_KNOWLEDGE_SOURCE_FORM_SCHEMA.parse(value);
			const { name, websiteUrl } = normalizedValue;

			if (sourceType === "file" && !selectedFile) {
				toast.error("Please upload a file");
				return;
			}

			if (sourceType === "website" && !websiteUrl) {
				toast.error("Please enter a website URL");
				return;
			}

			setIsSubmitting(true);
			try {
				if (sourceType === "file" && selectedFile) {
					const formData = new FormData();
					formData.set("file", selectedFile);

					const uploadResponse = await fetch("/api/storage", {
						method: "POST",
						body: formData,
					});
					const uploadPayload = (await uploadResponse.json().catch(() => null)) as {
						error?: string;
						key?: string;
					} | null;

					if (!uploadResponse.ok) {
						throw new Error(uploadPayload?.error ?? "Failed to upload file.");
					}

					const fileKey = uploadPayload?.key?.trim();
					if (!fileKey) {
						throw new Error("Upload completed without a storage key.");
					}

					const payload = createKnowledgeSourceInputSchema.parse({
						fileKey,
						fileName: selectedFile.name,
						name,
						sizeBytes: selectedFile.size,
						type: "FILE",
					});

					await createKnowledgeSourceMutation.mutateAsync(payload);
				} else {
					const payload = createKnowledgeSourceInputSchema.parse({
						name,
						sourceUrl: websiteUrl,
						type: "WEBSITE",
					});

					await createKnowledgeSourceMutation.mutateAsync(payload);
				}

				toast.success("Knowledge source added");
				setIsOpen(false);
				resetForm();
				await queryClient.invalidateQueries({
					queryKey: trpc.knowledge.list.queryOptions().queryKey,
				});
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Failed to add knowledge source");
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	const clearSelectedFile = () => {
		setSelectedFile(null);
		const fileInput = fileInputRef.current;
		if (fileInput) {
			fileInput.value = "";
		}
	};

	const resetForm = () => {
		setSourceType("file");
		createKnowledgeSourceForm.reset();
		clearSelectedFile();
	};

	return (
		<Sheet
			onOpenChange={(nextOpen) => {
				setIsOpen(nextOpen);
				if (!nextOpen) {
					resetForm();
				}
			}}
			open={isOpen}
		>
			<SheetTrigger render={<Button />}>Add source</SheetTrigger>
			<SheetContent floating showCloseButton={false} side="right">
				<SheetHeader>
					<SheetTitle>Add AI Knowledge Source</SheetTitle>
					<SheetDescription>
						Upload files or crawl a website to improve AI responses.
					</SheetDescription>
				</SheetHeader>

				<form
					className="flex flex-1 flex-col"
					onSubmit={(event) => {
						event.preventDefault();
						void createKnowledgeSourceForm.handleSubmit();
					}}
				>
					<FieldGroup className="px-6">
						<createKnowledgeSourceForm.Field
							name="name"
							children={(field) => {
								const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Name</FieldLabel>
										<InputGroup>
											<InputGroupAddon>
												<InputGroupText>
													<FileTextIcon />
												</InputGroupText>
											</InputGroupAddon>
											<InputGroupInput
												aria-invalid={isInvalid}
												autoComplete="off"
												id={field.name}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(event) => {
													field.handleChange(event.target.value);
												}}
												placeholder="Add knowledge source name"
												value={field.state.value}
											/>
										</InputGroup>
										{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
									</Field>
								);
							}}
						/>

						<Field>
							<FieldLabel>Type</FieldLabel>
							<ToggleGroup
								disabled={isSubmitting}
								onValueChange={(value) => {
									const nextType = value[0];
									if (nextType === "file" || nextType === "website") {
										setSourceType(nextType);
									}
								}}
								size="lg"
								spacing={0}
								value={[sourceType]}
								variant="outline"
							>
								<ToggleGroupItem className="flex-1 justify-center" value="file">
									<UploadIcon data-icon="inline-start" />
									Upload file
								</ToggleGroupItem>
								<ToggleGroupItem className="flex-1 justify-center" value="website">
									<GlobeIcon data-icon="inline-start" />
									Website
								</ToggleGroupItem>
							</ToggleGroup>
						</Field>

						{sourceType === "file" ? (
							<Field>
								<FieldLabel htmlFor="knowledge-file">Upload file</FieldLabel>
								<input
									accept={SUPPORTED_FILE_TYPES}
									className="sr-only"
									disabled={isSubmitting}
									id="knowledge-file"
									onChange={(event) => {
										const nextFile = event.target.files?.[0] ?? null;
										if (!nextFile) {
											setSelectedFile(null);
											return;
										}

										if (nextFile.size > MAX_UPLOAD_SIZE_BYTES) {
											toast.error("File size must be 10 MB or less");
											clearSelectedFile();
											return;
										}

										setSelectedFile(nextFile);
									}}
									ref={fileInputRef}
									type="file"
								/>
								<Attachment className="w-full" state={selectedFile ? "done" : "idle"}>
									<AttachmentMedia>
										<UploadIcon />
									</AttachmentMedia>
									<AttachmentContent>
										<AttachmentTitle>
											{selectedFile ? selectedFile.name : "Drop or upload a file"}
										</AttachmentTitle>
										<AttachmentDescription>
											{selectedFile ? formatFileSize(selectedFile.size) : "Max 10 MB"}
										</AttachmentDescription>
									</AttachmentContent>
									{selectedFile ? (
										<AttachmentActions>
											<AttachmentAction
												onClick={() => {
													clearSelectedFile();
												}}
												type="button"
											>
												<XIcon />
												<span className="sr-only">Remove file</span>
											</AttachmentAction>
										</AttachmentActions>
									) : null}
									<AttachmentTrigger
										onClick={() => {
											fileInputRef.current?.click();
										}}
									>
										<span className="sr-only">Choose file to upload</span>
									</AttachmentTrigger>
								</Attachment>
								<FieldDescription>
									Supported file types: PDF, DOC, DOCX, XLSX, TXT, HTML
								</FieldDescription>
							</Field>
						) : (
							<createKnowledgeSourceForm.Field
								name="websiteUrl"
								children={(field) => {
									const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Website URL</FieldLabel>
											<InputGroup>
												<InputGroupAddon>
													<InputGroupText>
														<GlobeIcon />
													</InputGroupText>
												</InputGroupAddon>
												<InputGroupInput
													aria-invalid={isInvalid}
													id={field.name}
													name={field.name}
													onBlur={field.handleBlur}
													onChange={(event) => {
														field.handleChange(event.target.value);
													}}
													placeholder="https://example.com/docs"
													type="url"
													value={field.state.value}
												/>
											</InputGroup>
											{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
											<FieldDescription>
												Crawl a public website and sync its contents.
											</FieldDescription>
										</Field>
									);
								}}
							/>
						)}
					</FieldGroup>

					<SheetFooter>
						<Button disabled={isSubmitting} type="submit">
							Done
						</Button>
						<SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
