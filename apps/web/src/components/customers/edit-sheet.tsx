"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import {
	customerChannelsSchema,
	customerNameSchema,
	customerPhoneSchema,
	type CreateCustomerInput,
} from "@use-forever/contracts";
import { PhoneIcon, UserRound } from "lucide-react";
import { Button } from "@use-forever/ui/components/button";
import { Checkbox } from "@use-forever/ui/components/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@use-forever/ui/components/field";
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
} from "@use-forever/ui/components/sheet";
import { Spinner } from "@use-forever/ui/components/spinner";
import { formatPhoneInput } from "@use-forever/utils";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { CUSTOMER_CHANNEL_OPTIONS } from "./channels";
import type { CustomerRow } from "./columns";
import { queryClient, trpc } from "@/utils/trpc";

type EditSheetProps = {
	customer: CustomerRow | null;
	open: boolean;
	onOpenChange: (nextOpen: boolean) => void;
};

const EMPTY_EDIT_CUSTOMER_FORM: CreateCustomerInput = {
	name: "",
	phone: "",
	channels: [],
};

const editCustomerFormSchema = z.object({
	name: customerNameSchema,
	phone: customerPhoneSchema,
	channels: customerChannelsSchema,
});

export function EditSheet({ customer, open, onOpenChange }: EditSheetProps) {
	const editCustomerMutation = useMutation(
		trpc.customers.update.mutationOptions({
			onSuccess: async (updatedCustomer) => {
				toast.success(`Updated ${updatedCustomer.name}`);
				onOpenChange(false);
				await queryClient.invalidateQueries({
					queryKey: trpc.customers.list.queryOptions().queryKey,
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);
	const editCustomerForm = useForm({
		defaultValues: EMPTY_EDIT_CUSTOMER_FORM,
		validators: {
			onSubmit: editCustomerFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (!customer) {
				return;
			}
			await editCustomerMutation.mutateAsync({
				customerId: customer.id,
				...value,
			});
		},
	});

	useEffect(() => {
		if (!open || !customer) {
			return;
		}
		editCustomerForm.reset({
			name: customer.name,
			phone: customer.phone,
			channels: Array.isArray(customer.channels) ? customer.channels : [],
		});
	}, [customer, editCustomerForm, open]);

	return (
		<Sheet
			onOpenChange={(nextOpen) => {
				onOpenChange(nextOpen);
				if (!nextOpen) {
					editCustomerForm.reset();
				}
			}}
			open={open}
		>
			<SheetContent floating showCloseButton={false} side="right">
				<SheetHeader>
					<SheetTitle>Edit customer</SheetTitle>
					<SheetDescription>Update the customer&apos;s name and phone number.</SheetDescription>
				</SheetHeader>
				<form
					className="flex flex-1 flex-col"
					onSubmit={(event) => {
						event.preventDefault();
						void editCustomerForm.handleSubmit();
					}}
				>
					<FieldGroup className="px-6">
						<editCustomerForm.Field
							children={(field) => {
								const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Name</FieldLabel>
										<InputGroup>
											<InputGroupAddon>
												<InputGroupText>
													<UserRound />
												</InputGroupText>
											</InputGroupAddon>
											<InputGroupInput
												aria-invalid={isInvalid}
												autoComplete="off"
												id={field.name}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(event) => field.handleChange(event.target.value)}
												placeholder="Dzulhelmy Bin Nazri"
												value={field.state.value}
											/>
										</InputGroup>
										{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
									</Field>
								);
							}}
							name="name"
						/>
						<editCustomerForm.Field
							children={(field) => {
								const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Phone</FieldLabel>
										<InputGroup>
											<InputGroupAddon>
												<InputGroupText>
													<PhoneIcon />
												</InputGroupText>
											</InputGroupAddon>
											<InputGroupInput
												aria-invalid={isInvalid}
												autoComplete="off"
												id={field.name}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(formatPhoneInput(event.target.value))
												}
												placeholder="+60 12-345 6789"
												value={field.state.value}
											/>
										</InputGroup>
										{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
									</Field>
								);
							}}
							name="phone"
						/>
						<editCustomerForm.Field
							children={(field) => {
								const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel>Channels</FieldLabel>
										<div className="grid gap-2">
											{CUSTOMER_CHANNEL_OPTIONS.map((option) => {
												const isChecked = field.state.value.includes(option.value);
												return (
													<label
														key={option.value}
														className="flex items-center gap-2 text-sm"
														htmlFor={`${field.name}-${option.value}`}
													>
														<Checkbox
															checked={isChecked}
															id={`${field.name}-${option.value}`}
															onBlur={field.handleBlur}
															onCheckedChange={(checked) => {
																const nextChannels =
																	checked === true
																		? [...field.state.value, option.value]
																		: field.state.value.filter(
																				(channel) => channel !== option.value,
																			);
																field.handleChange(nextChannels);
															}}
														/>
														<span>{option.label}</span>
													</label>
												);
											})}
										</div>
										{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
									</Field>
								);
							}}
							name="channels"
						/>
					</FieldGroup>

					<SheetFooter>
						<Button disabled={editCustomerMutation.isPending || !customer} type="submit">
							{editCustomerMutation.isPending ? <Spinner data-icon="inline-start" /> : "Save"}
						</Button>
						<SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
