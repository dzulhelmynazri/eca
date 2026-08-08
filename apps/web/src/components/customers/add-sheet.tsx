"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createCustomerInputSchema, type CreateCustomerInput } from "@use-forever/contracts";
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
	SheetTrigger,
} from "@use-forever/ui/components/sheet";
import { Spinner } from "@use-forever/ui/components/spinner";
import { formatPhoneInput } from "@use-forever/utils";
import { useState } from "react";
import { toast } from "sonner";

import { CUSTOMER_CHANNEL_OPTIONS } from "./channels";
import { queryClient, trpc } from "@/utils/trpc";

const EMPTY_CREATE_CUSTOMER_FORM: CreateCustomerInput = {
	name: "",
	phone: "",
	channels: [],
};

export function AddSheet() {
	const [isOpen, setIsOpen] = useState(false);
	const createCustomerMutation = useMutation(
		trpc.customers.create.mutationOptions({
			onSuccess: async () => {
				toast.success("Customer added");
				setIsOpen(false);
				await queryClient.invalidateQueries({
					queryKey: trpc.customers.list.queryOptions().queryKey,
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const createCustomerForm = useForm({
		defaultValues: EMPTY_CREATE_CUSTOMER_FORM,
		validators: {
			onSubmit: createCustomerInputSchema,
		},
		onSubmit: async ({ value }) => {
			await createCustomerMutation.mutateAsync(value);
		},
	});

	return (
		<Sheet
			onOpenChange={(nextOpen) => {
				setIsOpen(nextOpen);
				if (!nextOpen) {
					createCustomerForm.reset();
				}
			}}
			open={isOpen}
		>
			<SheetTrigger render={<Button />}>Add customer</SheetTrigger>
			<SheetContent floating showCloseButton={false} side="right">
				<SheetHeader>
					<SheetTitle>Add customer</SheetTitle>
					<SheetDescription>
						Create a new customer with their name and phone number.
					</SheetDescription>
				</SheetHeader>
				<form
					className="flex flex-1 flex-col"
					onSubmit={(event) => {
						event.preventDefault();
						void createCustomerForm.handleSubmit();
					}}
				>
					<FieldGroup className="px-6">
						<createCustomerForm.Field
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
						<createCustomerForm.Field
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
						<createCustomerForm.Field
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
						<Button disabled={createCustomerMutation.isPending} type="submit">
							{createCustomerMutation.isPending ? <Spinner data-icon="inline-start" /> : "Add"}
						</Button>
						<SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
