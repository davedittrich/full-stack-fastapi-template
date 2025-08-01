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
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useEffect } from "react"
import { FiArrowLeft } from "react-icons/fi"

import { type ApiError, type ChallengeUpdate } from "../../../client"
import { ChallengesService } from "../../../client/challenges"
import useCustomToast from "../../../hooks/useCustomToast"

export const Route = createFileRoute("/challenges/$challengeId/edit")({
  component: EditChallenge,
})

interface ChallengeFormData {
  title: string
  author: string
  url?: string
  description: string
  date_posted?: string
}

function EditChallenge() {
  const { challengeId } = Route.useParams()
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const router = useRouter()
  const bgColor = useColorModeValue("ui.white", "ui.dark")

  const {
    data: challenge,
    isPending: challengeLoading,
    isError: challengeError,
    error: challengeErrorDetails,
  } = useQuery({
    queryKey: ["challenges", challengeId],
    queryFn: () => ChallengesService.readChallenge({ id: challengeId }),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChallengeFormData>({
    mode: "onBlur",
    criteriaMode: "all",
  })

  useEffect(() => {
    if (challenge) {
      reset({
        title: challenge.title,
        author: challenge.author,
        url: challenge.url || "",
        description: challenge.description,
        date_posted: challenge.date_posted,
      })
    }
  }, [challenge, reset])

  const mutation = useMutation({
    mutationFn: (data: ChallengeUpdate) =>
      ChallengesService.updateChallenge({ 
        id: challengeId, 
        requestBody: data 
      }),
    onSuccess: (data) => {
      showToast("Success!", "Challenge updated successfully.", "success")
      queryClient.invalidateQueries({ queryKey: ["challenges"] })
      queryClient.invalidateQueries({ queryKey: ["challenges", challengeId] })
      router.navigate({ 
        to: "/challenges/$challengeId", 
        params: { challengeId: data.id } 
      })
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
  })

  const onSubmit: SubmitHandler<ChallengeFormData> = async (data) => {
    const challengeData: ChallengeUpdate = {
      title: data.title,
      author: data.author,
      url: data.url || undefined,
      description: data.description,
      date_posted: data.date_posted,
    }
    mutation.mutate(challengeData)
  }

  if (challengeLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" width="full">
        <Spinner size="xl" color="ui.main" />
      </Flex>
    )
  }

  if (challengeError) {
    const errDetail = (challengeErrorDetails?.body as any)?.detail || "Challenge not found"
    return (
      <Container maxW="full">
        <Alert status="error" mt={4}>
          <AlertIcon />
          <AlertTitle>Error loading challenge!</AlertTitle>
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

  if (!challenge) {
    return (
      <Container maxW="full">
        <Alert status="warning" mt={4}>
          <AlertIcon />
          <AlertTitle>Challenge not found!</AlertTitle>
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
    <Container maxW="md">
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
        Edit Challenge
      </Heading>

      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={6} bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
          <FormControl isRequired isInvalid={!!errors.title}>
            <FormLabel htmlFor="title">Challenge Title</FormLabel>
            <Input
              id="title"
              {...register("title", {
                required: "Title is required.",
                minLength: {
                  value: 4,
                  message: "Title must be at least 4 characters.",
                },
              })}
              placeholder="Enter challenge title"
            />
            {errors.title && (
              <FormErrorMessage>{errors.title.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.author}>
            <FormLabel htmlFor="author">Author</FormLabel>
            <Input
              id="author"
              {...register("author", {
                required: "Author is required.",
              })}
              placeholder="Enter author name"
            />
            {errors.author && (
              <FormErrorMessage>{errors.author.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.url}>
            <FormLabel htmlFor="url">Challenge URL (Optional)</FormLabel>
            <Input
              id="url"
              type="url"
              {...register("url", {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: "Please enter a valid URL starting with http:// or https://",
                },
              })}
              placeholder="https://example.com/challenge"
            />
            {errors.url && (
              <FormErrorMessage>{errors.url.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.description}>
            <FormLabel htmlFor="description">Description</FormLabel>
            <Textarea
              id="description"
              {...register("description", {
                required: "Description is required.",
                minLength: {
                  value: 20,
                  message: "Description must be at least 20 characters.",
                },
              })}
              placeholder="Describe the challenge, its objectives, and what participants need to do..."
              rows={6}
            />
            {errors.description && (
              <FormErrorMessage>{errors.description.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.date_posted}>
            <FormLabel htmlFor="date_posted">Date Posted</FormLabel>
            <Input
              id="date_posted"
              type="date"
              {...register("date_posted", {
                required: "Date is required.",
              })}
            />
            {errors.date_posted && (
              <FormErrorMessage>{errors.date_posted.message}</FormErrorMessage>
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
            Update Challenge
          </Button>
        </VStack>
      </form>
    </Container>
  )
}