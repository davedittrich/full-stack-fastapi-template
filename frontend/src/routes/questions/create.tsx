import {
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Textarea,
  VStack,
  useColorModeValue,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router"
import { type SubmitHandler, useForm, Controller } from "react-hook-form"
import { FiArrowLeft } from "react-icons/fi"

import { type ApiError, type QuestionCreate } from "../../client"
import { QuestionsService, ChallengesService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"

export const Route = createFileRoute("/questions/create")({
  component: CreateQuestion,
  validateSearch: (search: Record<string, unknown>) => ({
    challengeId: (search.challengeId as string) || undefined,
  }),
})

interface QuestionFormData {
  type: string
  step?: number
  subject: string
  description: string
  more_info: string
  challenge_id: string
}

const HELP_REQUEST_TYPES = [
  "general",
  "technical",
  "installation",
  "configuration",
  "troubleshooting",
  "concept_clarification",
  "tool_usage",
  "environment_setup",
  "other"
]

function CreateQuestion() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const router = useRouter()
  const search = useSearch({ from: "/questions/create" })
  const bgColor = useColorModeValue("ui.white", "ui.dark")

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      type: "general",
      step: undefined,
      subject: "",
      description: "",
      more_info: "",
      challenge_id: search.challengeId || "",
    },
  })

  const {
    data: challenges,
  } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => ChallengesService.readChallenges({}),
  })

  const mutation = useMutation({
    mutationFn: (data: QuestionCreate) =>
      QuestionsService.createQuestion({ requestBody: data }),
    onSuccess: (data) => {
      showToast("Success!", "Help request created successfully.", "success")
      queryClient.invalidateQueries({ queryKey: ["questions"] })
      router.navigate({ 
        to: "/questions/$questionId", 
        params: { questionId: data.id } 
      })
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
  })

  const onSubmit: SubmitHandler<QuestionFormData> = async (data) => {
    const questionData: QuestionCreate = {
      type: data.type,
      step: data.step || undefined,
      subject: data.subject,
      description: data.description,
      more_info: data.more_info,
      challenge_id: data.challenge_id,
    }
    mutation.mutate(questionData)
  }

  return (
    <Container maxW="2xl">
      <Flex justify="space-between" align="center" py={8}>
        <Button
          onClick={() => router.history.back()}
          leftIcon={<FiArrowLeft />}
          variant="ghost"
        >
          Back
        </Button>
      </Flex>

      <Heading size="lg" textAlign="center" mb={8}>
        Ask for Help
      </Heading>

      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={6} bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
          <FormControl isRequired isInvalid={!!errors.subject}>
            <FormLabel htmlFor="subject">Subject</FormLabel>
            <Input
              id="subject"
              {...register("subject", {
                required: "Subject is required.",
                minLength: {
                  value: 3,
                  message: "Subject must be at least 3 characters.",
                },
              })}
              placeholder="Brief summary of your issue..."
            />
            {errors.subject && (
              <FormErrorMessage>{errors.subject.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.type}>
            <FormLabel htmlFor="type">Help Request Type</FormLabel>
            <Select
              id="type"
              {...register("type", {
                required: "Help request type is required.",
              })}
            >
              {HELP_REQUEST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </Select>
            {errors.type && (
              <FormErrorMessage>{errors.type.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.step}>
            <FormLabel htmlFor="step">Challenge Step (Optional)</FormLabel>
            <Controller
              name="step"
              control={control}
              rules={{
                min: {
                  value: 1,
                  message: "Step must be at least 1.",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <NumberInput
                  value={value || ""}
                  onChange={(_, valueAsNumber) => onChange(valueAsNumber)}
                  min={1}
                >
                  <NumberInputField placeholder="Which step are you stuck on?" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              )}
            />
            {errors.step && (
              <FormErrorMessage>{errors.step.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.challenge_id}>
            <FormLabel htmlFor="challenge_id">Associated Challenge</FormLabel>
            <Select
              id="challenge_id"
              {...register("challenge_id", {
                required: "Please select a challenge.",
              })}
              placeholder="Select a challenge"
            >
              {challenges?.data.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </option>
              ))}
            </Select>
            {errors.challenge_id && (
              <FormErrorMessage>{errors.challenge_id.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.description}>
            <FormLabel htmlFor="description">Detailed Description</FormLabel>
            <Textarea
              id="description"
              {...register("description", {
                required: "Description is required.",
                minLength: {
                  value: 10,
                  message: "Description must be at least 10 characters.",
                },
              })}
              placeholder="Describe your issue in detail..."
              rows={4}
            />
            {errors.description && (
              <FormErrorMessage>{errors.description.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.more_info}>
            <FormLabel htmlFor="more_info">Additional Information</FormLabel>
            <Textarea
              id="more_info"
              {...register("more_info", {
                required: "Additional information is required.",
                minLength: {
                  value: 5,
                  message: "Additional information must be at least 5 characters.",
                },
              })}
              placeholder="What have you tried so far? Error messages? Screenshots descriptions?"
              rows={3}
            />
            {errors.more_info && (
              <FormErrorMessage>{errors.more_info.message}</FormErrorMessage>
            )}
          </FormControl>

          <Button
            variant="solid"
            colorScheme="ui.main"
            type="submit"
            isLoading={isSubmitting || mutation.isPending}
            loadingText="Creating..."
            w="full"
          >
            Submit Help Request
          </Button>
        </VStack>
      </form>
    </Container>
  )
}