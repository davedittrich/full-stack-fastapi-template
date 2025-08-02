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
  Tooltip,
} from "@chakra-ui/react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { FiEdit, FiEye, FiTrash2, FiPlus, FiSearch, FiHelpCircle } from "react-icons/fi"

import { type ApiError, type AssessmentPublic } from "../client"
import { AssessmentsService, ChallengesService } from "../client"
import useCustomToast from "../hooks/useCustomToast"
import { handleError } from "../utils"

export const Route = createFileRoute("/assessments")({
  component: Assessments,
})

function Assessments() {
  const { showSuccessToast } = useCustomToast()
  const queryClient = useQueryClient()
  const { open, onOpen, onClose } = useDisclosure()
  const [assessmentToDelete, setAssessmentToDelete] = useState<AssessmentPublic | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [challengeFilter, setChallengeFilter] = useState("")
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  const {
    data: assessments,
    isPending: assessmentsLoading,
    isError: assessmentsError,
    error: assessmentsErrorDetails,
  } = useQuery({
    queryKey: ["assessments", { challengeId: challengeFilter }],
    queryFn: () => AssessmentsService.readAssessments({
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
    mutationFn: (id: string) => AssessmentsService.deleteAssessment({ id }),
    onSuccess: () => {
      showToast("Success!", "Assessment deleted successfully.", "success")
      onClose()
      queryClient.invalidateQueries({
        queryKey: ["assessments"],
      })
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
  })

  const getHintMutation = useMutation({
    mutationFn: (id: string) => AssessmentsService.getAssessmentHint({ id }),
    onSuccess: (data) => {
      showToast("Hint", data.hint || "No hint available", "info")
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
  })

  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return
    deleteMutation.mutate(assessmentToDelete.id)
  }

  const confirmDelete = (assessment: AssessmentPublic) => {
    setAssessmentToDelete(assessment)
    onOpen()
  }

  const handleGetHint = (assessmentId: string) => {
    getHintMutation.mutate(assessmentId)
  }

  const filteredAssessments = assessments?.data.filter(assessment =>
    assessment.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.question_type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (assessmentsLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" width="full">
        <Spinner size="xl" color="ui.main" />
      </Flex>
    )
  }

  if (assessmentsError) {
    const errDetail = (assessmentsErrorDetails?.body as any)?.detail
    showToast("Something went wrong.", `${errDetail}`, "error")
  }

  return (
    <>
      <Container maxW="full">
        <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
          Assessment Management
        </Heading>

        <Flex py={8} gap={4} direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }}>
          <Button
            as={Link}
            to="/assessments/create"
            leftIcon={<FiPlus />}
            colorScheme="ui.main"
            variant="solid"
          >
            Create Assessment
          </Button>

          <HStack spacing={4} flex={1}>
            <InputGroup maxW="300px">
              <Input
                placeholder="Search assessments..."
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
              <Th>Question</Th>
              <Th>Type</Th>
              <Th>Points</Th>
              <Th>Difficulty</Th>
              <Th>Challenge</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredAssessments.map((assessment) => {
              const challenge = challenges?.data.find(c => c.id === assessment.challenge_id)

              return (
              <Tr key={assessment.id}>
                <Td maxW="300px">
                  <Text isTruncated fontWeight="medium">
                    {assessment.question_text}
                  </Text>
                </Td>
                <Td>
                  <Badge colorScheme="blue" variant="subtle">
                    {assessment.question_type || 'short_answer'}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme="green" variant="subtle">
                    {assessment.points || 10} pts
                  </Badge>
                </Td>
                <Td>
                  <Badge
                    colorScheme={
                      assessment.difficulty === 'easy' ? 'green' :
                      assessment.difficulty === 'hard' ? 'red' : 'yellow'
                    }
                    variant="outline"
                  >
                    {assessment.difficulty || 'medium'}
                  </Badge>
                </Td>
                <Td maxW="200px">
                  {challenge ? (
                    <Link
                      to="/challenges/$challengeId"
                      params={{ challengeId: challenge.id }}
                      style={{ color: "var(--chakra-colors-ui-main)" }}
                    >
                      <Text isTruncated>{challenge.title}</Text>
                    </Link>
                  ) : (
                    <Text color="ui.dim">No challenge</Text>
                  )}
                </Td>
                <Td>
                  <Badge
                    colorScheme={assessment.is_active ? "green" : "gray"}
                    variant={assessment.is_active ? "solid" : "outline"}
                  >
                    {assessment.is_active ? "Active" : "Inactive"}
                  </Badge>
                </Td>
                <Td>
                  <Flex gap={2}>
                    <IconButton
                      as={Link}
                      to="/assessments/$assessmentId"
                      params={{ assessmentId: assessment.id }}
                      aria-label="View assessment"
                      icon={<FiEye />}
                      size="sm"
                      variant="ghost"
                    />
                    <Tooltip label="Get hint (students only)">
                      <IconButton
                        onClick={() => handleGetHint(assessment.id)}
                        aria-label="Get hint"
                        icon={<FiHelpCircle />}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        isLoading={getHintMutation.isPending}
                      />
                    </Tooltip>
                    <IconButton
                      as={Link}
                      to="/assessments/$assessmentId/edit"
                      params={{ assessmentId: assessment.id }}
                      aria-label="Edit assessment"
                      icon={<FiEdit />}
                      size="sm"
                      variant="ghost"
                    />
                    <IconButton
                      onClick={() => confirmDelete(assessment)}
                      aria-label="Delete assessment"
                      icon={<FiTrash2 />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                    />
                  </Flex>
                </Td>
              </Tr>
            )
            })}
          </Tbody>
        </Table>

        {filteredAssessments.length === 0 && (
          <Flex justify="center" align="center" height="200px">
            <Heading size="md" color="ui.dim">
              {searchTerm || challengeFilter
                ? "No assessments match your filters"
                : "No assessments found. Create your first assessment!"
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
              Delete Assessment
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this assessment? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAssessment}
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
