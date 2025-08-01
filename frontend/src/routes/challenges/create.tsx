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
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiArrowLeft } from "react-icons/fi"

import { type ApiError, type ChallengeCreate } from "../../client"
import { ChallengesService } from "../../client/challenges"
import useCustomToast from "../../hooks/useCustomToast"

export const Route = createFileRoute("/challenges/create")({
  component: CreateChallenge,
})

interface ChallengeFormData {
  title: string
  author: string
  url?: string
  description: string
  date_posted?: string
}

function CreateChallenge() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const router = useRouter()
  const bgColor = useColorModeValue("ui.white", "ui.dark")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChallengeFormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      author: "",
      url: "",
      description: "",
      date_posted: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ChallengeCreate) =>
      ChallengesService.createChallenge({ requestBody: data }),
    onSuccess: (data) => {
      showToast("Success!", "Challenge created successfully.", "success")
      queryClient.invalidateQueries({ queryKey: ["challenges"] })
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
    const challengeData: ChallengeCreate = {
      title: data.title,
      author: data.author,
      url: data.url || undefined,
      description: data.description,
      date_posted: data.date_posted || new Date().toISOString().split('T')[0],
    }
    mutation.mutate(challengeData)
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
        Create New Challenge
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
            loadingText="Creating..."
            w="full"
          >
            Create Challenge
          </Button>
        </VStack>
      </form>
    </Container>
  )
}