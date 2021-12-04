import React, { useCallback, useState, useEffect } from "react";

import client from "part:@sanity/base/client";
import BlockContent from "@sanity/block-content-to-react";
import { Dialog, Box, Text, Button, Heading } from "@sanity/ui";
import { SanityDocument } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { StyledGrid, Wrapper } from "./styled";

const builder = imageUrlBuilder(client);
function urlFor(source: string) {
  return builder.image(source);
}

/** This component will work in two views:
 * DIALOG - when users first come to sanity if there are new release notes.
 * TOOL - for when users want to see historical release notes.
 */
export const ReleaseNotes = () => {
  const toolView = window.location.pathname.includes("releaseNotes");
  const [releaseNotes, setReleaseNotes] = useState<SanityDocument[]>([]);
  const [activeReleaseNotes, setActiveReleaseNotes] =
    useState<SanityDocument | null>(null);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const onClose = useCallback(() => {
    setActiveReleaseNotes((current) => !current);
    setShowReleaseNotes(false);
  }, []);
  const onOpen = useCallback(
    () => setShowReleaseNotes((current) => !current),
    []
  );

  /**
   * Gather all release notes and check if there are new release notes.
   */
  useEffect(() => {
    async function gatherDocuments() {
      const existingReleaseNotes = localStorage.getItem("releaseNotes") ?? null;
      const parsedExistingReleaseNotes = existingReleaseNotes
        ? JSON.parse(existingReleaseNotes)
        : null;
      const query = `*[_type == "sanityReleaseNotes"] | order(releaseDate desc)`;
      const allReleaseNotes: SanityDocument[] = await client.fetch(query);
      const newReleaseNotes: SanityDocument | null = allReleaseNotes?.length
        ? allReleaseNotes[0]
        : null;
      if (
        !!parsedExistingReleaseNotes?.releaseDate &&
        newReleaseNotes?.releaseDate === parsedExistingReleaseNotes.releaseDate
      ) {
        setReleaseNotes(allReleaseNotes);
      } else {
        setReleaseNotes(allReleaseNotes);
        localStorage.setItem("releaseNotes", JSON.stringify(newReleaseNotes));
        setShowReleaseNotes(true);
        onOpen();
      }
    }
    gatherDocuments();
  }, []);

  const serializers = {
    types: {
      blockContentImage: (props: any) => (
        <img
          style={{ maxWidth: toolView ? "70%" : "100%" }}
          src={urlFor(props.node.asset).url()}
        />
      ),
    },
  };

  if (toolView) {
    const mappedReleaseNotes = releaseNotes.map((note, index) => {
      return (
        <React.Fragment key={`${note._id}-${index}`}>
          <Button onClick={() => setActiveReleaseNotes(note)}>
            {`Release Notes: ${note.releaseDate}`}
          </Button>
          {activeReleaseNotes && (
            <Dialog
              width={3}
              header={`Sanity Release Notes: ${note.releaseDate}`}
              id="release Notes Dialog"
              onClose={onClose}
              zOffset={1000}
            >
              <Box padding={4}>
                <BlockContent
                  serializers={serializers}
                  blocks={activeReleaseNotes.releaseNotes}
                  projectId=""
                  dataset={client.clientConfig.dataset}
                />
              </Box>
            </Dialog>
          )}
        </React.Fragment>
      );
    });

    return (
      <Wrapper>
        <StyledGrid>
          <Heading as={"h2"} size={3} style={{ padding: "0 0 20px 0" }}>
            Historical Sanity Release Notes
          </Heading>
          {mappedReleaseNotes}
        </StyledGrid>
      </Wrapper>
    );
  }
  return (
    <>
      {showReleaseNotes && releaseNotes?.length && (
        <Dialog
          width={3}
          header="Sanity Release Notes"
          id="release-notes-ialog"
          onClose={onClose}
          zOffset={1000}
        >
          <Box padding={4}>
            <BlockContent
              serializers={serializers}
              blocks={releaseNotes[0]?.releaseNotes}
              projectId=""
              dataset={client.clientConfig.dataset}
            />
            <a href={"/releaseNotesTool"}>
              <Text>See Historical Release Notes</Text>
            </a>
          </Box>
        </Dialog>
      )}
    </>
  );
};
