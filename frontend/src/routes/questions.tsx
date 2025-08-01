import {
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Button,
  useDisclosure,
  Flex,
  Spinner,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Badge,
  Text,
  Input,
  InputGroup,
  InputRightElement,
  HStack,
  Select,
} from "@chakra-ui/react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { FiEdit, FiEye, FiTrash2, FiPlus, FiSearch, FiFilter } from "react-icons/fi"

import { type ApiError, type QuestionPublic } from "../client"
import { QuestionsService } from "../client/questions"
import { ChallengesService } from "../client/challenges"
import useCustomToast from "../hooks/useCustomToast"

export const Route = createFileRoute("/questions")({
  component: Questions,
})

function Questions() {
  const showToast = useCustomToast()
  const queryClient = useQueryClient()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [questionToDelete, setQuestionToDelete] = useState<QuestionPublic | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [challengeFilter, setChallengeFilter] = useState("")
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  const {
    data: questions,
    isPending: questionsLoading,
    isError: questionsError,
    error: questionsErrorDetails,
  } = useQuery({
    queryKey: ["questions", { challengeId: challengeFilter }],
    queryFn: () => QuestionsService.readQuestions({ 
      challengeId: challengeFilter || undefined 
    }),
  })

  const {
    data: challenges,
  } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => ChallengesService.readChallenges({}),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => QuestionsService.deleteQuestion({ id }),
    onSuccess: () => {
      showToast("Success!", "Question deleted successfully.", "success")
      onClose()
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      })
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
  })

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return
    deleteMutation.mutate(questionToDelete.id)
  }

  const confirmDelete = (question: QuestionPublic) => {
    setQuestionToDelete(question)
    onOpen()
  }

  const filteredQuestions = questions?.data.filter(question =>
    question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.question_type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (questionsLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" width="full">
        <Spinner size="xl" color="ui.main" />
      </Flex>
    )
  }

  if (questionsError) {
    const errDetail = (questionsErrorDetails?.body as any)?.detail
    showToast("Something went wrong.", `${errDetail}`, "error")
  }

  return (
    <>
      <Container maxW="full">
        <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
          Question Management
        </Heading>

        <Flex py={8} gap={4} direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }}>
          <Button
            as={Link}
            to="/questions/create"
            leftIcon={<FiPlus />}
            colorScheme="ui.main"
            variant="solid"
          >
            Create Question
          </Button>

          <HStack spacing={4} flex={1}>
            <InputGroup maxW="300px">
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <InputRightElement>
                <FiSearch />
              </InputRightElement>
            </InputGroup>

            <Select
              placeholder="Filter by challenge"
              value={challengeFilter}
              onChange={(e) => setChallengeFilter(e.target.value)}
              maxW="250px"
            >
              {challenges?.data.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </option>
              ))}
            </Select>
          </HStack>
        </Flex>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Question Text</Th>
              <Th>Type</Th>
              <Th>Points</Th>
              <Th>Challenge</Th>
              <Th>Assigned To</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredQuestions.map((question) => (
              <Tr key={question.id}>
                <Td maxW="300px">
                  <Text isTruncated>
                    {question.question_text}
                  </Text>
                </Td>
                <Td>
                  <Badge colorScheme="blue" variant="subtle">
                    {question.question_type}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme="green" variant="subtle">
                    {question.points}
                  </Badge>
                </Td>
                <Td maxW="200px">
                  {question.challenge ? (
                    <Link
                      to="/challenges/$challengeId"
                      params={{ challengeId: question.challenge.id }}
                      style={{ color: "var(--chakra-colors-ui-main)" }}
                    >
                      <Text isTruncated>{question.challenge.title}</Text>
                    </Link>
                  ) : (
                    <Text color="ui.dim">No challenge</Text>
                  )}
                </Td>
                <Td>
                  {question.assigned_to ? (
                    <Badge colorScheme="purple" variant="subtle">
                      {question.assigned_to}
                    </Badge>
                  ) : (
                    <Text color="ui.dim" fontSize="sm">Unassigned</Text>
                  )}
                </Td>
                <Td>
                  <Flex gap={2}>
                    <IconButton
                      as={Link}
                      to="/questions/$questionId"
                      params={{ questionId: question.id }}
                      aria-label="View question"
                      icon={<FiEye />}
                      size="sm"
                      variant="ghost"
                    />
                    <IconButton
                      as={Link}
                      to="/questions/$questionId/edit"
                      params={{ questionId: question.id }}
                      aria-label="Edit question"
                      icon={<FiEdit />}
                      size="sm"
                      variant="ghost"
                    />
                    <IconButton
                      onClick={() => confirmDelete(question)}
                      aria-label="Delete question"
                      icon={<FiTrash2 />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                    />
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {filteredQuestions.length === 0 && (
          <Flex justify="center" align="center" height="200px">
            <Heading size="md" color="ui.dim">
              {searchTerm || challengeFilter 
                ? "No questions match your filters" 
                : "No questions found. Create your first question!"
              }
            </Heading>
          </Flex>
        )}
      </Container>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Question
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteQuestion}
                ml={3}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}