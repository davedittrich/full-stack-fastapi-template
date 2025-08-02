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
  Switch,
  FormHelperText,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { type SubmitHandler, useForm, Controller } from "react-hook-form"
import { FiArrowLeft } from "react-icons/fi"
import { useEffect } from "react"

import { type ApiError, type AssessmentUpdate } from "../../../client"
import { AssessmentsService, ChallengesService } from "../../../client"
import useCustomToast from "../../../hooks/useCustomToast"

export const Route = createFileRoute("/assessments/$assessmentId/edit")({
  component: EditAssessment,
})

interface AssessmentFormData {
  question_text: string
  question_type: string
  points: number
  challenge_id: string
  answer_text?: string
  hint_text?: string
  flag_format?: string
  difficulty: string
  is_active: boolean
}

const ASSESSMENT_TYPES = [
  "short_answer",
  "multiple_choice",
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

const DIFFICULTY_LEVELS = [
  "easy",
  "medium",
  "hard"
]

function EditAssessment() {
  const { assessmentId } = Route.useParams()
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const router = useRouter()
  const bgColor = useColorModeValue("ui.white", "ui.dark")

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssessmentFormData>({
    mode: "onBlur",
    criteriaMode: "all",
  })

  const {
    data: assessment,
    isPending: assessmentLoading,
    isError: assessmentError,
    error: assessmentErrorDetails,
  } = useQuery({
    queryKey: ["assessments", assessmentId],
    queryFn: () => AssessmentsService.readAssessment({ id: assessmentId }),
  })

  const {
    data: challenges,
  } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => ChallengesService.readChallenges({}),
  })

  // Reset form when assessment data loads
  useEffect(() => {
    if (assessment) {
      reset({
        question_text: assessment.question_text,
        question_type: assessment.question_type || "short_answer",
        points: assessment.points || 10,
        challenge_id: assessment.challenge_id,
        answer_text: assessment.answer_text || "",
        hint_text: assessment.hint_text || "",
        flag_format: assessment.flag_format || "",
        difficulty: assessment.difficulty || "medium",
        is_active: assessment.is_active ?? true,
      })
    }
  }, [assessment, reset])

  const mutation = useMutation({
    mutationFn: (data: AssessmentUpdate) =>
      AssessmentsService.updateAssessment({
        id: assessmentId,
        requestBody: data
      }),
    onSuccess: () => {
      showToast("Success!", "Assessment updated successfully.", "success")
      queryClient.invalidateQueries({ queryKey: ["assessments"] })
      queryClient.invalidateQueries({ queryKey: ["assessments", assessmentId] })
      router.navigate({
        to: "/assessments/$assessmentId",
        params: { assessmentId }
      })
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
  })

  const onSubmit: SubmitHandler<AssessmentFormData> = async (data) => {
    const assessmentData: AssessmentUpdate = {
      question_text: data.question_text,
      question_type: data.question_type,
      points: data.points,
      challenge_id: data.challenge_id,
      answer_text: data.answer_text || undefined,
      hint_text: data.hint_text || undefined,
      flag_format: data.flag_format || undefined,
      difficulty: data.difficulty,
      is_active: data.is_active,
    }
    mutation.mutate(assessmentData)
  }

  if (assessmentLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" width="full">
        <Spinner size="xl" color="ui.main" />
      </Flex>
    )
  }

  if (assessmentError) {
    const errDetail = (assessmentErrorDetails?.body as any)?.detail
    showToast("Something went wrong.", `${errDetail}`, "error")
    return (
      <Container maxW="2xl">
        <Alert status="error">
          <AlertIcon />
          Failed to load assessment details.
        </Alert>
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
        Edit Assessment
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
              placeholder="Enter the assessment question..."
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
              {ASSESSMENT_TYPES.map((type) => (
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

          <FormControl isRequired isInvalid={!!errors.difficulty}>
            <FormLabel htmlFor="difficulty">Difficulty Level</FormLabel>
            <Select
              id="difficulty"
              {...register("difficulty", {
                required: "Difficulty level is required.",
              })}
            >
              {DIFFICULTY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </Select>
            {errors.difficulty && (
              <FormErrorMessage>{errors.difficulty.message}</FormErrorMessage>
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

          <FormControl isInvalid={!!errors.answer_text}>
            <FormLabel htmlFor="answer_text">Answer Text (Optional)</FormLabel>
            <Textarea
              id="answer_text"
              {...register("answer_text")}
              placeholder="Enter the correct answer or solution..."
              rows={3}
            />
            <FormHelperText>
              Students will not see this answer. Only visible to lecturers and admins.
            </FormHelperText>
            {errors.answer_text && (
              <FormErrorMessage>{errors.answer_text.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.hint_text}>
            <FormLabel htmlFor="hint_text">Hint Text (Optional)</FormLabel>
            <Textarea
              id="hint_text"
              {...register("hint_text")}
              placeholder="Enter a helpful hint for students..."
              rows={2}
            />
            <FormHelperText>
              Students can request hints during assessments.
            </FormHelperText>
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
            <FormHelperText>
              For CTF-style questions, specify the expected flag format.
            </FormHelperText>
            {errors.flag_format && (
              <FormErrorMessage>{errors.flag_format.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl>
            <Flex align="center">
              <FormLabel htmlFor="is_active" mb="0">
                Active Assessment
              </FormLabel>
              <Controller
                name="is_active"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Switch
                    id="is_active"
                    isChecked={value}
                    onChange={onChange}
                    colorScheme="ui.main"
                  />
                )}
              />
            </Flex>
            <FormHelperText>
              Only active assessments are visible to students.
            </FormHelperText>
          </FormControl>

          <Button
            variant="solid"
            colorScheme="ui.main"
            type="submit"
            isLoading={isSubmitting || mutation.isPending}
            loadingText="Updating..."
            w="full"
          >
            Update Assessment
          </Button>
        </VStack>
      </form>
    </Container>
  )
}
