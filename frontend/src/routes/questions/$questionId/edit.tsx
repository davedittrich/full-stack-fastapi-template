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
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { type SubmitHandler, useForm, Controller } from "react-hook-form"
import { useEffect } from "react"
import { FiArrowLeft } from "react-icons/fi"

import { type ApiError, type QuestionUpdate } from "../../../client"
import { QuestionsService } from "../../../client/questions"
import { ChallengesService } from "../../../client/challenges"
import useCustomToast from "../../../hooks/useCustomToast"

export const Route = createFileRoute("/questions/$questionId/edit")({
  component: EditQuestion,
})

interface QuestionFormData {
  question_text: string
  question_type: string
  points: number
  challenge_id?: string
  answer_text?: string
  hint_text?: string
  flag_format?: string
  assigned_to?: string
}

const QUESTION_TYPES = [
  "multiple_choice",
  "short_answer",
  "essay",
  "coding",
  "flag_capture",
  "forensics",
  "reverse_engineering",
  "web_security",
  "cryptography",
  "network_security",
  "other"
]

function EditQuestion() {
  const { questionId } = Route.useParams()
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const router = useRouter()
  const bgColor = useColorModeValue("ui.white", "ui.dark")

  const {
    data: question,
    isPending: questionLoading,
    isError: questionError,
    error: questionErrorDetails,
  } = useQuery({
    queryKey: ["questions", questionId],
    queryFn: () => QuestionsService.readQuestion({ id: questionId }),
  })

  const {
    data: challenges,
  } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => ChallengesService.readChallenges({}),
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormData>({
    mode: "onBlur",
    criteriaMode: "all",
  })

  useEffect(() => {
    if (question) {
      reset({
        question_text: question.question_text,
        question_type: question.question_type,
        points: question.points,
        challenge_id: question.challenge?.id || "",
        answer_text: question.answer_text || "",
        hint_text: question.hint_text || "",
        flag_format: question.flag_format || "",
        assigned_to: question.assigned_to || "",
      })
    }
  }, [question, reset])

  const mutation = useMutation({
    mutationFn: (data: QuestionUpdate) =>
      QuestionsService.updateQuestion({ 
        id: questionId, 
        requestBody: data 
      }),
    onSuccess: (data) => {
      showToast("Success!", "Question updated successfully.", "success")
      queryClient.invalidateQueries({ queryKey: ["questions"] })
      queryClient.invalidateQueries({ queryKey: ["questions", questionId] })
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
    const questionData: QuestionUpdate = {
      question_text: data.question_text,
      question_type: data.question_type,
      points: data.points,
      challenge_id: data.challenge_id || undefined,
      answer_text: data.answer_text || undefined,
      hint_text: data.hint_text || undefined,
      flag_format: data.flag_format || undefined,
      assigned_to: data.assigned_to || undefined,
    }
    mutation.mutate(questionData)
  }

  if (questionLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" width="full">
        <Spinner size="xl" color="ui.main" />
      </Flex>
    )
  }

  if (questionError) {
    const errDetail = (questionErrorDetails?.body as any)?.detail || "Question not found"
    return (
      <Container maxW="full">
        <Alert status="error" mt={4}>
          <AlertIcon />
          <AlertTitle>Error loading question!</AlertTitle>
          <AlertDescription>{errDetail}</AlertDescription>
        </Alert>
        <Button
          onClick={() => router.history.back()}
          leftIcon={<FiArrowLeft />}
          mt={4}
          variant="ghost"
        >
          Back
        </Button>
      </Container>
    )
  }

  if (!question) {
    return (
      <Container maxW="full">
        <Alert status="warning" mt={4}>
          <AlertIcon />
          <AlertTitle>Question not found!</AlertTitle>
        </Alert>
        <Button
          onClick={() => router.history.back()}
          leftIcon={<FiArrowLeft />}
          mt={4}
          variant="ghost"
        >
          Back
        </Button>
      </Container>
    )
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
        Edit Question
      </Heading>

      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={6} bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
          <FormControl isRequired isInvalid={!!errors.question_text}>
            <FormLabel htmlFor="question_text">Question Text</FormLabel>
            <Textarea
              id="question_text"
              {...register("question_text", {
                required: "Question text is required.",
                minLength: {
                  value: 10,
                  message: "Question text must be at least 10 characters.",
                },
              })}
              placeholder="Enter the question text..."
              rows={4}
            />
            {errors.question_text && (
              <FormErrorMessage>{errors.question_text.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.question_type}>
            <FormLabel htmlFor="question_type">Question Type</FormLabel>
            <Select
              id="question_type"
              {...register("question_type", {
                required: "Question type is required.",
              })}
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </Select>
            {errors.question_type && (
              <FormErrorMessage>{errors.question_type.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.points}>
            <FormLabel htmlFor="points">Points</FormLabel>
            <Controller
              name="points"
              control={control}
              rules={{
                required: "Points are required.",
                min: {
                  value: 1,
                  message: "Points must be at least 1.",
                },
                max: {
                  value: 1000,
                  message: "Points cannot exceed 1000.",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <NumberInput
                  value={value}
                  onChange={(_, valueAsNumber) => onChange(valueAsNumber || 0)}
                  min={1}
                  max={1000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              )}
            />
            {errors.points && (
              <FormErrorMessage>{errors.points.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.challenge_id}>
            <FormLabel htmlFor="challenge_id">Associated Challenge (Optional)</FormLabel>
            <Select
              id="challenge_id"
              {...register("challenge_id")}
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

          <FormControl isInvalid={!!errors.answer_text}>
            <FormLabel htmlFor="answer_text">Answer Text (Optional)</FormLabel>
            <Textarea
              id="answer_text"
              {...register("answer_text")}
              placeholder="Enter the correct answer or solution..."
              rows={3}
            />
            {errors.answer_text && (
              <FormErrorMessage>{errors.answer_text.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.hint_text}>
            <FormLabel htmlFor="hint_text">Hint Text (Optional)</FormLabel>
            <Textarea
              id="hint_text"
              {...register("hint_text")}
              placeholder="Enter a helpful hint for participants..."
              rows={2}
            />
            {errors.hint_text && (
              <FormErrorMessage>{errors.hint_text.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.flag_format}>
            <FormLabel htmlFor="flag_format">Flag Format (Optional)</FormLabel>
            <Input
              id="flag_format"
              {...register("flag_format")}
              placeholder="e.g., flag{...} or tanzanite{...}"
            />
            {errors.flag_format && (
              <FormErrorMessage>{errors.flag_format.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.assigned_to}>
            <FormLabel htmlFor="assigned_to">Assigned To (Optional)</FormLabel>
            <Input
              id="assigned_to"
              {...register("assigned_to")}
              placeholder="Enter username or email"
            />
            {errors.assigned_to && (
              <FormErrorMessage>{errors.assigned_to.message}</FormErrorMessage>
            )}
          </FormControl>

          <Button
            variant="solid"
            colorScheme="ui.main"
            type="submit"
            isLoading={isSubmitting || mutation.isPending}
            loadingText="Updating..."
            w="full"
          >
            Update Question
          </Button>
        </VStack>
      </form>
    </Container>
  )
}