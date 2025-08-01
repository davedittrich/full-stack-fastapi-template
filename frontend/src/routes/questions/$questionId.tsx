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
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Card,
  CardBody,
  CardHeader,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { FiEdit, FiArrowLeft, FiFlag, FiUser, FiAward, FiType } from "react-icons/fi"

import { QuestionsService } from "../../client/questions"

export const Route = createFileRoute("/questions/$questionId")({
  component: QuestionDetail,
})

function QuestionDetail() {
  const { questionId } = Route.useParams()
  const router = useRouter()

  const {
    data: question,
    isPending: questionLoading,
    isError: questionError,
    error: questionErrorDetails,
  } = useQuery({
    queryKey: ["questions", questionId],
    queryFn: () => QuestionsService.readQuestion({ id: questionId }),
  })

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
          as={Link}
          to="/questions"
          leftIcon={<FiArrowLeft />}
          mt={4}
          variant="ghost"
        >
          Back to Questions
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
          as={Link}
          to="/questions"
          leftIcon={<FiArrowLeft />}
          mt={4}
          variant="ghost"
        >
          Back to Questions
        </Button>
      </Container>
    )
  }

  return (
    <Container maxW="4xl">
      <Flex justify="space-between" align="center" py={8}>
        <Button
          as={Link}
          to="/questions"
          leftIcon={<FiArrowLeft />}
          variant="ghost"
        >
          Back to Questions
        </Button>
        <Button
          as={Link}
          to="/questions/$questionId/edit"
          params={{ questionId }}
          leftIcon={<FiEdit />}
          colorScheme="ui.main"
          variant="outline"
        >
          Edit Question
        </Button>
      </Flex>

      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="xl" mb={4}>
            {question.question_text}
          </Heading>
          
          <HStack spacing={4} mb={6} flexWrap="wrap">
            <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
              <HStack spacing={1}>
                <FiType size={14} />
                <Text fontSize="sm">{question.question_type}</Text>
              </HStack>
            </Badge>
            
            <Badge colorScheme="green" px={3} py={1} borderRadius="full">
              <HStack spacing={1}>
                <FiAward size={14} />
                <Text fontSize="sm">{question.points} points</Text>
              </HStack>
            </Badge>

            {question.assigned_to && (
              <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                <HStack spacing={1}>
                  <FiUser size={14} />
                  <Text fontSize="sm">{question.assigned_to}</Text>
                </HStack>
              </Badge>
            )}
          </HStack>
        </Box>

        <Divider />

        {question.challenge && (
          <>
            <Card>
              <CardHeader>
                <Heading size="md" display="flex" alignItems="center" gap={2}>
                  <FiFlag />
                  Associated Challenge
                </Heading>
              </CardHeader>
              <CardBody pt={0}>
                <Button
                  as={Link}
                  to="/challenges/$challengeId"
                  params={{ challengeId: question.challenge.id }}
                  variant="link"
                  colorScheme="ui.main"
                  fontSize="lg"
                  fontWeight="semibold"
                  p={0}
                  h="auto"
                >
                  {question.challenge.title}
                </Button>
                <Text color="ui.dim" mt={2}>
                  {question.challenge.description}
                </Text>
              </CardBody>
            </Card>
            <Divider />
          </>
        )}

        {question.answer_text && (
          <Card>
            <CardHeader>
              <Heading size="md">Answer</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Text whiteSpace="pre-wrap" lineHeight="1.6">
                {question.answer_text}
              </Text>
            </CardBody>
          </Card>
        )}

        {question.hint_text && (
          <Card>
            <CardHeader>
              <Heading size="md">Hint</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Text whiteSpace="pre-wrap" lineHeight="1.6">
                {question.hint_text}
              </Text>
            </CardBody>
          </Card>
        )}

        {question.flag_format && (
          <Card>
            <CardHeader>
              <Heading size="md">Flag Format</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Text fontFamily="mono" bg="ui.inputbg" p={3} borderRadius="md">
                {question.flag_format}
              </Text>
            </CardBody>
          </Card>
        )}

        {(!question.answer_text && !question.hint_text && !question.flag_format) && (
          <Box textAlign="center" py={8}>
            <Text color="ui.dim">
              No additional details provided for this question.
            </Text>
          </Box>
        )}
      </VStack>
    </Container>
  )
}