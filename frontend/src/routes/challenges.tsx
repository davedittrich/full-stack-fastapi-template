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
} from "@chakra-ui/react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { FiEdit, FiEye, FiTrash2, FiPlus } from "react-icons/fi"

import { type ApiError, type ChallengePublic } from "../client"
import { ChallengesService } from "../client/challenges"
import useCustomToast from "../hooks/useCustomToast"
import { formatDate } from "../utils"

export const Route = createFileRoute("/challenges")({
  component: Challenges,
})

function Challenges() {
  const showToast = useCustomToast()
  const queryClient = useQueryClient()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [challengeToDelete, setChallengeToDelete] = useState<ChallengePublic | null>(null)
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  const {
    data: challenges,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => ChallengesService.readChallenges({}),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ChallengesService.deleteChallenge({ id }),
    onSuccess: () => {
      showToast("Success!", "Challenge deleted successfully.", "success")
      onClose()
      queryClient.invalidateQueries({
        queryKey: ["challenges"],
      })
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
  })

  const handleDeleteChallenge = async () => {
    if (!challengeToDelete) return
    deleteMutation.mutate(challengeToDelete.id)
  }

  const confirmDelete = (challenge: ChallengePublic) => {
    setChallengeToDelete(challenge)
    onOpen()
  }

  if (isPending) {
    return (
      <Flex justify="center" align="center" height="100vh" width="full">
        <Spinner size="xl" color="ui.main" />
      </Flex>
    )
  }

  if (isError) {
    const errDetail = (error?.body as any)?.detail
    showToast("Something went wrong.", `${errDetail}`, "error")
  }

  return (
    <>
      <Container maxW="full">
        <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
          Challenge Management
        </Heading>

        <Flex py={8} gap={4}>
          <Button
            as={Link}
            to="/challenges/create"
            leftIcon={<FiPlus />}
            colorScheme="ui.main"
            variant="solid"
          >
            Create Challenge
          </Button>
        </Flex>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Author</Th>
              <Th>Date Posted</Th>
              <Th>Description</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {challenges?.data.map((challenge) => (
              <Tr key={challenge.id}>
                <Td>
                  <Link
                    to="/challenges/$challengeId"
                    params={{ challengeId: challenge.id }}
                    style={{ color: "var(--chakra-colors-ui-main)" }}
                  >
                    {challenge.title}
                  </Link>
                </Td>
                <Td>{challenge.author}</Td>
                <Td>{formatDate(challenge.date_posted)}</Td>
                <Td maxW="300px" isTruncated>
                  {challenge.description}
                </Td>
                <Td>
                  <Flex gap={2}>
                    <IconButton
                      as={Link}
                      to="/challenges/$challengeId"
                      params={{ challengeId: challenge.id }}
                      aria-label="View challenge"
                      icon={<FiEye />}
                      size="sm"
                      variant="ghost"
                    />
                    <IconButton
                      as={Link}
                      to="/challenges/$challengeId/edit"
                      params={{ challengeId: challenge.id }}
                      aria-label="Edit challenge"
                      icon={<FiEdit />}
                      size="sm"
                      variant="ghost"
                    />
                    <IconButton
                      onClick={() => confirmDelete(challenge)}
                      aria-label="Delete challenge"
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

        {challenges?.data.length === 0 && (
          <Flex justify="center" align="center" height="200px">
            <Heading size="md" color="ui.dim">
              No challenges found. Create your first challenge!
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
              Delete Challenge
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{challengeToDelete?.title}"? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteChallenge}
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