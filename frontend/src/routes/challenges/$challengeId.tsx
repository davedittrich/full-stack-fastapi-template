import {
  Container,
  Heading,
  Text,
  Button,
  Flex,
  Badge,
  Box,
  VStack,
  HStack,
  Link as ChakraLink,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { FiEdit, FiArrowLeft, FiExternalLink, FiCalendar, FiUser } from "react-icons/fi"

import { ChallengesService } from "../../client/challenges"
import { QuestionsService } from "../../client/questions"
import { formatDate } from "../../utils"

export const Route = createFileRoute("/challenges/$challengeId")({
  component: ChallengeDetail,
})

function ChallengeDetail() {
  const { challengeId } = Route.useParams()
  const router = useRouter()

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
    data: questions,
    isPending: questionsLoading,
  } = useQuery({
    queryKey: ["questions", "challenge", challengeId],
    queryFn: () => QuestionsService.readQuestions({ challengeId }),
    enabled: !!challenge,
  })

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
          as={Link}
          to="/challenges"
          leftIcon={<FiArrowLeft />}
          mt={4}
          variant="ghost"
        >
          Back to Challenges
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
          as={Link}
          to="/challenges"
          leftIcon={<FiArrowLeft />}
          mt={4}
          variant="ghost"
        >
          Back to Challenges
        </Button>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <Flex justify="space-between" align="center" py={8}>
        <Button
          as={Link}
          to="/challenges"
          leftIcon={<FiArrowLeft />}
          variant="ghost"
        >
          Back to Challenges
        </Button>
        <Button
          as={Link}
          to="/challenges/$challengeId/edit"
          params={{ challengeId }}
          leftIcon={<FiEdit />}
          colorScheme="ui.main"
          variant="outline"
        >
          Edit Challenge
        </Button>
      </Flex>

      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="xl" mb={4}>
            {challenge.title}
          </Heading>
          
          <HStack spacing={4} mb={4}>
            <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
              <HStack spacing={1}>
                <FiUser size={14} />
                <Text fontSize="sm">{challenge.author}</Text>
              </HStack>
            </Badge>
            
            <Badge colorScheme="green" px={3} py={1} borderRadius="full">
              <HStack spacing={1}>
                <FiCalendar size={14} />
                <Text fontSize="sm">{formatDate(challenge.date_posted)}</Text>
              </HStack>
            </Badge>
          </HStack>

          {challenge.url && (
            <ChakraLink
              href={challenge.url}
              isExternal
              color="ui.main"
              display="inline-flex"
              alignItems="center"
              gap={1}
              mb={4}
            >
              View Original Challenge <FiExternalLink size={14} />
            </ChakraLink>
          )}
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={3}>
            Description
          </Heading>
          <Text whiteSpace="pre-wrap" lineHeight="1.6">
            {challenge.description}
          </Text>
        </Box>

        <Divider />

        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">
              Questions ({questions?.data.length || 0})
            </Heading>
            <Button
              as={Link}
              to="/questions/create"
              search={{ challengeId }}
              colorScheme="ui.main"
              variant="outline"
              size="sm"
            >
              Add Question
            </Button>
          </Flex>

          {questionsLoading ? (
            <Flex justify="center" py={8}>
              <Spinner color="ui.main" />
            </Flex>
          ) : questions?.data.length ? (
            <VStack align="stretch" spacing={3}>
              {questions.data.map((question) => (
                <Box
                  key={question.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  bg="ui.inputbg"
                >
                  <Flex justify="space-between" align="start">
                    <Box flex={1}>
                      <Heading size="sm" mb={2}>
                        {question.question_text}
                      </Heading>
                      <Text fontSize="sm" color="ui.dim">
                        Type: {question.question_type} | Points: {question.points}
                      </Text>
                      {question.assigned_to && (
                        <Text fontSize="sm" color="ui.dim" mt={1}>
                          Assigned to: {question.assigned_to}
                        </Text>
                      )}
                    </Box>
                    <Button
                      as={Link}
                      to="/questions/$questionId"
                      params={{ questionId: question.id }}
                      size="sm"
                      variant="ghost"
                    >
                      View
                    </Button>
                  </Flex>
                </Box>
              ))}
            </VStack>
          ) : (
            <Text color="ui.dim" textAlign="center" py={8}>
              No questions added to this challenge yet.
            </Text>
          )}
        </Box>
      </VStack>
    </Container>
  )
}